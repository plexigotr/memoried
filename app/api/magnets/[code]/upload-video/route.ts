import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bucket } from "@/lib/storage";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
const ffprobePath = process.env.FFPROBE_PATH || "ffprobe";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, args);

    let stderr = "";

    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on("error", (error) => {
      reject(error);
    });
  });
}

function runFfprobeDuration(filePath: string) {
  return new Promise<number>((resolve, reject) => {
    const ffprobe = spawn(ffprobePath, [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);

    let output = "";
    let stderr = "";

    ffprobe.stdout.on("data", (data) => {
      output += data.toString();
    });

    ffprobe.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code === 0) {
        resolve(Number(output.trim()));
      } else {
        reject(new Error(stderr || `ffprobe exited with code ${code}`));
      }
    });

    ffprobe.on("error", (error) => {
      reject(error);
    });
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  let inputPath = "";
  let outputPath = "";

  try {
    const formData = await request.formData();
    const title = String(formData.get("videoTitle") || "").trim();
    const file = formData.get("videoFile") as File | null;
    const trimStart = Number(formData.get("trimStart") || 0);
    const trimEnd = Number(formData.get("trimEnd") || 60);

    if (!file || file.size === 0) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=no-video-file`, request.url),
        303
      );
    }

    const magnet = await prisma.magnets.findUnique({
      where: {
        magnet_code: code,
      },
      include: {
        user: true,
        memory: {
          include: {
            memory_items: true,
          },
        },
      },
    });

    if (!magnet || !magnet.memory) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=no-memory`, request.url),
        303
      );
    }

    const videoCount = magnet.memory.memory_items.filter(
      (item) => item.item_type === "video"
    ).length;

    const isPremium =
      magnet.user?.plan_type === "premium" &&
      magnet.user?.premium_until &&
      magnet.user.premium_until > new Date();

    let maxVideos = isPremium ? 10 : 1;

    if (videoCount >= maxVideos) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=video-limit`, request.url),
        303
      );
    }

    const tmpDir = os.tmpdir();
    const inputName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const outputName = `${Date.now()}-optimized.mp4`;

    inputPath = path.join(tmpDir, inputName);
    outputPath = path.join(tmpDir, outputName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(inputPath, buffer);

    const duration = await runFfprobeDuration(inputPath);

    const safeTrimStart = Math.max(0, trimStart);
    const safeTrimEnd = Math.min(trimEnd, duration);
    const selectedDuration = safeTrimEnd - safeTrimStart;

    if (selectedDuration <= 0) {
      await fs.unlink(inputPath).catch(() => {});
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=invalid-trim-range`, request.url),
        303
      );
    }

    if (selectedDuration > 60) {
      await fs.unlink(inputPath).catch(() => {});
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=video-too-long`, request.url),
        303
      );
    }

    await runFfmpeg([
      "-y",
      "-ss",
      String(safeTrimStart),
      "-to",
      String(safeTrimEnd),
      "-i",
      inputPath,
      "-vf",
      "scale='min(1280,iw)':-2",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "28",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      outputPath,
    ]);

    const optimizedBuffer = await fs.readFile(outputPath);

    const filePath = `memories/${magnet.memory.id}/videos/${Date.now()}.mp4`;
    const bucketFile = bucket.file(filePath);

    await bucketFile.save(optimizedBuffer, {
      contentType: "video/mp4",
      resumable: false,
    });

    const lastSortOrder =
      Math.max(0, ...magnet.memory.memory_items.map((item) => item.sort_order)) || 0;

    await prisma.memory_items.create({
      data: {
        memory_id: magnet.memory.id,
        item_type: "video",
        title: title || null,
        file_path: filePath,
        sort_order: lastSortOrder + 1,
        is_visible: true,
      },
    });

    return NextResponse.redirect(new URL(`/m/${code}/edit`, request.url), 303);
  } catch (error) {
    console.error("Video upload error:", error);

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?error=video-upload-failed`, request.url),
      303
    );
  } finally {
    if (inputPath) await fs.unlink(inputPath).catch(() => {});
    if (outputPath) await fs.unlink(outputPath).catch(() => {});
  }
}