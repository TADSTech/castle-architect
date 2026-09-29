CUSTOM MUSIC - drop your tracks in this folder
=============================================

The game looks for these exact file names:

  game-music.mp3           Keep at 50% HP or more
  game-music-low.mp3       Keep below 50% HP
  game-music-critical.mp3  Keep below 20% HP

Format: .mp3 is the default, but .ogg / .m4a / .wav work too - just keep
the same name and change the ending (game-music.ogg, ...). The game tries
.mp3 first, then .ogg, .m4a, .wav.

The three tracks crossfade into each other as your Keep takes damage, and
all of them loop.

If a file is missing the game falls back along the chain
(calm -> low -> critical), so two files still cover the whole run.
If this folder is empty the built-in synth drone plays instead - the game
is never silent.

Development:   drop the files in, refresh the browser (bun run dev).
Release:       the files must be in here BEFORE you run `bun run build`,
               because they are copied into dist/ (and the zip) at build
               time.
