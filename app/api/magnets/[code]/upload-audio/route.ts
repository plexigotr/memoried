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
    const title = String(formData.get("audioTitle") || "").trim();
    const file = formData.get("audioFile") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=no-audio-file`, request.url),
        303
      );
    }

    const magnet = await prisma.magnets.findUnique({
      where: {
        magnet_code: code,
      },
      include: {
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

    const tmpDir = os.tmpdir();
    const inputName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const outputName = `${Date.now()}-optimized.mp3`;

    inputPath = path.join(tmpDir, inputName);
    outputPath = path.join(tmpDir, outputName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(inputPath, buffer);

    const duration = await runFfprobeDuration(inputPath);

    if (duration > 90) {
      await fs.unlink(inputPath).catch(() => {});
      return NextResponse.redirect(
        new URL(`/m/${code}/edit?error=audio-too-long`, request.url),
        303
      );
    }

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "128k",
      outputPath,
    ]);

    const optimizedBuffer = await fs.readFile(outputPath);
    const filePath = `memories/${magnet.memory.id}/audios/${Date.now()}.mp3`;
    const bucketFile = bucket.file(filePath);

    await bucketFile.save(optimizedBuffer, {
      contentType: "audio/mpeg",
      resumable: false,
    });

    const lastSortOrder =
      Math.max(0, ...magnet.memory.memory_items.map((item) => item.sort_order)) || 0;

    await prisma.memory_items.create({
      data: {
        memory_id: magnet.memory.id,
        item_type: "audio",
        title: title || null,
        file_path: filePath,
        sort_order: lastSortOrder + 1,
        is_visible: true,
      },
    });

    return NextResponse.redirect(new URL(`/m/${code}/edit`, request.url), 303);
  } catch (error) {
    console.error("Audio upload error:", error);

    return NextResponse.redirect(
      new URL(`/m/${code}/edit?error=audio-upload-failed`, request.url),
      303
    );
  } finally {
    if (inputPath) await fs.unlink(inputPath).catch(() => {});
    if (outputPath) await fs.unlink(outputPath).catch(() => {});
  }
}