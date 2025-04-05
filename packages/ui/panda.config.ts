import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,
  outExtension: 'js',
  jsxFramework: "react",

  include: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],

  exclude: [],

  theme: {
    extend: {},
  },

  outdir: "styled-system",
});
