#!/usr/bin/env ts-node
/**
 * KeepCode — Auto Campaign Scheduler
 *
 * Runs the full 5-day, 10-post campaign automatically.
 * Posts are spaced across 5 days: 2 posts per day (9 AM + 6 PM).
 *
 * Usage:
 *   npm run campaign                 — start from Day 1
 *   npm run campaign -- --dry-run    — preview all posts, no posting
 *   npm run campaign -- --from day3  — resume from a specific day
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { TwitterApi } from "twitter-api-v2";
import chalk from "chalk";
import ora from "ora";
import * as dotenv from "dotenv";
import { threads, schedule, type Tweet, type Thread } from "./threads";

// ─── Setup ────────────────────────────────────────────────────────────────────

const envPath = path.resolve(__dirname, "../.env");
if (!fs.existsSync(envPath)) {
  console.error(chalk.red(`\n✖  .env not found at ${envPath}\n`));
  process.exit(1);
}
dotenv.config({ path: envPath });

const {
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_TOKEN_SECRET,
} = process.env;

if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
  console.error(chalk.red("\n✖  Missing Twitter credentials in .env\n"));
  process.exit(1);
}

const client = new TwitterApi({
  appKey: TWITTER_API_KEY,
  appSecret: TWITTER_API_SECRET,
  accessToken: TWITTER_ACCESS_TOKEN,
  accessSecret: TWITTER_ACCESS_TOKEN_SECRET,
}).readWrite;

const ASSETS_DIR = path.resolve(__dirname, "../assets");
const STATE_FILE = path.resolve(__dirname, "../.campaign_state.json");

// ─── State Management ─────────────────────────────────────────────────────────

interface CampaignState {
  startedAt: string;
  posted: string[]; // threadIds already posted
}

function loadState(): CampaignState {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  }
  return { startedAt: new Date().toISOString(), posted: [] };
}

function saveState(state: CampaignState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function charCount(text: string): number {
  return text.replace(/https?:\/\/\S+/g, "x".repeat(23)).length;
}

async function ask(q: string): Promise<string> {
  const iface = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => iface.question(q, (a) => { iface.close(); res(a.trim()); }));
}

async function uploadMedia(mediaPath: string): Promise<string | undefined> {
  const full = path.resolve(ASSETS_DIR, mediaPath.replace("assets/", ""));
  if (!fs.existsSync(full)) return undefined;
  return client.v1.uploadMedia(fs.readFileSync(full), { mimeType: "image/png" });
}

// ─── Post Thread ──────────────────────────────────────────────────────────────

async function postThread(thread: Thread, dryRun: boolean): Promise<void> {
  let replyToId: string | undefined;

  for (let i = 0; i < thread.tweets.length; i++) {
    const tweet = thread.tweets[i];
    const chars = charCount(tweet.content);

    if (chars > 280) {
      console.log(chalk.red(`  ⚠  Tweet ${i + 1} is ${chars} chars — SKIPPED (over 280 limit)`));
      continue;
    }

    const label = thread.tweets.length > 1
      ? `[${i + 1}/${thread.tweets.length}] `
      : "";

    const spinner = ora(`  ${label}Posting...`).start();

    if (dryRun) {
      await sleep(400);
      spinner.succeed(chalk.dim(`  ${label}[DRY RUN] would post → ${tweet.content.split("\n")[0].slice(0, 60)}…`));
      continue;
    }

    try {
      let mediaIds: [string] | undefined;
      if (tweet.mediaPath) {
        const id = await uploadMedia(tweet.mediaPath);
        if (id) mediaIds = [id];
      }

      const payload: {
        text: string;
        reply?: { in_reply_to_tweet_id: string };
        media?: { media_ids: [string] };
      } = { text: tweet.content };

      if (replyToId) payload.reply = { in_reply_to_tweet_id: replyToId };
      if (mediaIds)  payload.media = { media_ids: mediaIds };

      const result = await client.v2.tweet(payload);
      replyToId = result.data.id;

      spinner.succeed(
        chalk.green(`  ${label}Posted`) +
        chalk.dim(` → https://x.com/i/web/status/${result.data.id}`)
      );

      if (i < thread.tweets.length - 1) await sleep(2500);
    } catch (err: unknown) {
      spinner.fail(chalk.red(`  ${label}Failed: ${err instanceof Error ? err.message : String(err)}`));
      throw err;
    }
  }
}

// ─── Print Schedule ───────────────────────────────────────────────────────────

function printSchedule(state: CampaignState): void {
  console.log(chalk.bold("\n  KeepCode — 5-Day Launch Campaign\n"));

  const now = new Date();
  const startMs = new Date(state.startedAt).getTime();

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  schedule.forEach((slot, idx) => {
    const thread = threads.find((t) => t.id === slot.threadId);
    if (!thread) return;

    const slotMs = startMs + ((slot.day - 1) * 24 + slot.hour) * 3600 * 1000;
    const slotDate = new Date(slotMs);
    const dayLabel = `${days[slotDate.getDay()]} ${slotDate.getMonth() + 1}/${slotDate.getDate()} ${String(slot.hour).padStart(2, "0")}:00`;
    const isPast = slotMs < now.getTime();
    const isDone = state.posted.includes(slot.threadId);
    const isSoon = !isDone && slotMs - now.getTime() < 30 * 60 * 1000;

    let status: string;
    if (isDone) {
      status = chalk.green("✔ posted");
    } else if (isSoon) {
      status = chalk.yellow("⚡ up next");
    } else if (isPast) {
      status = chalk.red("✖ missed");
    } else {
      const minsAway = Math.round((slotMs - now.getTime()) / 60000);
      const hoursAway = Math.floor(minsAway / 60);
      status = chalk.dim(
        hoursAway >= 24
          ? `in ${Math.floor(hoursAway / 24)}d ${hoursAway % 24}h`
          : hoursAway > 0
          ? `in ${hoursAway}h ${minsAway % 60}m`
          : `in ${minsAway}m`
      );
    }

    const tweetCount = chalk.dim(`${thread.tweets.length} tweet${thread.tweets.length > 1 ? "s" : ""}`);
    console.log(
      `  ${chalk.cyan(`[${idx + 1}]`)}  ${chalk.white(dayLabel.padEnd(22))}  ${thread.title.padEnd(35)}  ${tweetCount.padEnd(10)}  ${status}`
    );
  });

  console.log();
}

// ─── Run Campaign ─────────────────────────────────────────────────────────────

async function runCampaign(dryRun: boolean, fromDay?: number): Promise<void> {
  const state = loadState();
  if (fromDay) {
    // Reset posted list for items on/after fromDay
    const resetIds = schedule.filter((s) => s.day >= fromDay).map((s) => s.threadId);
    state.posted = state.posted.filter((id) => !resetIds.includes(id));
    state.startedAt = new Date(
      Date.now() - ((fromDay - 1) * 24 * 3600 * 1000)
    ).toISOString();
    saveState(state);
  }

  printSchedule(state);

  if (dryRun) {
    console.log(chalk.yellow("  DRY RUN MODE — previewing all pending posts\n"));
    for (const slot of schedule) {
      if (state.posted.includes(slot.threadId)) continue;
      const thread = threads.find((t) => t.id === slot.threadId);
      if (!thread) continue;
      console.log(chalk.bold(`\n  ── ${thread.title} (Day ${slot.day}, ${slot.hour}:00) ──`));
      await postThread(thread, true);
    }
    console.log(chalk.dim("\n  Dry run complete.\n"));
    return;
  }

  // Live mode — wait for scheduled times and post
  console.log(chalk.bold("  Running live campaign. Press Ctrl+C to pause.\n"));
  console.log(chalk.dim("  Progress is saved — rerun to resume from where you stopped.\n"));

  const startMs = new Date(state.startedAt).getTime();

  for (const slot of schedule) {
    if (state.posted.includes(slot.threadId)) {
      console.log(chalk.dim(`  ✔ Skipping ${slot.threadId} (already posted)`));
      continue;
    }

    const thread = threads.find((t) => t.id === slot.threadId);
    if (!thread) continue;

    const slotMs = startMs + ((slot.day - 1) * 24 + slot.hour) * 3600 * 1000;
    const now = Date.now();
    const waitMs = slotMs - now;

    if (waitMs > 0) {
      const waitMins = Math.round(waitMs / 60000);
      const waitHours = (waitMs / 3600000).toFixed(1);
      console.log(
        chalk.dim(`\n  Next: `) +
        chalk.white(`"${thread.title}"`) +
        chalk.dim(` in ${waitMins > 90 ? waitHours + "h" : waitMins + "min"}`)
      );

      // Show countdown, check every minute
      const checkInterval = Math.min(waitMs, 60_000);
      while (Date.now() < slotMs) {
        await sleep(checkInterval);
        const remaining = slotMs - Date.now();
        if (remaining > 0) {
          process.stdout.write(
            `\r${chalk.dim(`  Waiting... ${Math.ceil(remaining / 60000)}min remaining    `)}`
          );
        }
      }
      process.stdout.write("\r" + " ".repeat(60) + "\r");
    }

    console.log(chalk.bold(`\n  ── ${thread.title} ──`));
    try {
      await postThread(thread, false);
      state.posted.push(slot.threadId);
      saveState(state);
      console.log(chalk.green(`  ✔ Done. Progress saved.\n`));
    } catch {
      console.log(chalk.red(`  ✖ Failed. Will retry on next run.\n`));
      break;
    }
  }

  if (state.posted.length === schedule.length) {
    console.log(chalk.bold(chalk.green("\n  🎉 Campaign complete! All 10 posts published.\n")));
  }
}

// ─── Interactive Menu ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run") || args.includes("-d");
  const fromArg = args.find((a) => a.startsWith("--from"));
  const fromDay = fromArg ? parseInt(fromArg.split("=")[1] ?? fromArg.split(" ")[1] ?? "1", 10) : undefined;

  const state = loadState();
  printSchedule(state);

  console.log(chalk.dim("  Options:"));
  console.log(`  ${chalk.cyan("d")}  Dry run — preview all pending posts (no posting)`);
  console.log(`  ${chalk.cyan("s")}  Start / resume live campaign`);
  console.log(`  ${chalk.cyan("r")}  Restart campaign from Day 1`);
  console.log(`  ${chalk.cyan("1-5")}  Restart from a specific day`);
  console.log(`  ${chalk.cyan("q")}  Quit\n`);

  if (isDryRun) {
    await runCampaign(true, fromDay);
    return;
  }

  const choice = await ask(chalk.bold("  Choice: "));

  if (choice === "q" || choice === "Q") {
    console.log(chalk.dim("\n  Bye.\n"));
    return;
  }

  if (choice === "d") {
    await runCampaign(true);
  } else if (choice === "s") {
    const confirm = await ask(chalk.yellow("\n  Start live campaign? It will post on schedule. (yes/no): "));
    if (confirm.toLowerCase() === "yes") {
      await runCampaign(false);
    }
  } else if (choice === "r") {
    const confirm = await ask(chalk.red("\n  Reset all progress and restart from Day 1? (YES/no): "));
    if (confirm === "YES") {
      fs.writeFileSync(STATE_FILE, JSON.stringify({ startedAt: new Date().toISOString(), posted: [] }, null, 2));
      await runCampaign(false, 1);
    }
  } else if (["1", "2", "3", "4", "5"].includes(choice)) {
    const day = parseInt(choice, 10);
    console.log(chalk.yellow(`\n  Resuming from Day ${day}...`));
    await runCampaign(false, day);
  } else {
    console.log(chalk.dim("\n  Unknown choice.\n"));
  }
}

main().catch((err) => {
  console.error(chalk.red("\n✖ Fatal error:"), err);
  process.exit(1);
});
