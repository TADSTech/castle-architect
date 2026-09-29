=============================================================================
CASTLE ARCHITECT: SIEGE LAB - CUSTOM SOUNDTRACK INSTRUCTIONS
=============================================================================

You can drop your own audio files into this folder (public/music/) using these exact names:

  1. game-music-ambient.mp3 (or game-music.mp3)
     -> Plays during the calm Build Phase & Title Menus.

  2. game-music-battle.mp3
     -> Plays during active Siege Battles when Keep Health is >= 50%.

  3. game-music-low.mp3
     -> Plays during active Siege Battles when Keep Health drops below 50%.

  4. game-music-critical.mp3
     -> Plays during active Siege Battles when Keep Health drops below 20% (Panic / Danger).

-----------------------------------------------------------------------------
Supported Formats:
  .mp3, .ogg, .m4a, .wav (First matching format found is used).

Fallback Behavior:
  If any specific file is missing, the game falls back along the chain:
  (Ambient -> Battle -> Low -> Critical).
  If no files are added, the game's built-in 4-tier WebAudio procedural synth
  automatically synthesizes dynamic ambient lutes, marching war drums, and
  critical heartbeat rumbles on the fly in real-time!

-----------------------------------------------------------------------------
Rebuild after adding music files:
  bun run build
  Compress-Archive -Path dist/* -DestinationPath castle-architect-siege-lab.zip -Force
=============================================================================
