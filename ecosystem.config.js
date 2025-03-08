module.exports = {
  apps: [
    {
      name: "TetriCH2Bsky",
      script: "src/index.ts",
      interpreter: "node",
      exec_mode: "fork",
      interpreter_args: ["-r", "tsx"],
      watch: true,
      autorestart: false,
    },
  ],
};
