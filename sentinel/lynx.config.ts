import { defineConfig } from '@lynx-js/rspeedy'

import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin'
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin'
import { pluginTailwindCSS } from "rsbuild-plugin-tailwindcss"
import { pluginTypeCheck } from '@rsbuild/plugin-type-check'

export default defineConfig({
  plugins: [
    pluginQRCode({
      schema(url) {
        // We use `?fullscreen=true` to open the page in LynxExplorer in full screen mode
        return `${url}?fullscreen=true`
      },
    }),
    pluginReactLynx(),
    pluginTailwindCSS({
      // Optional: specify the path to your Tailwind CSS configuration file
      config: "./tailwind.config.js",
      include: /\.[jt]sx?/,
      exclude: ["./src/store/**", /[\\/]node_modules[\\/]/],
    }),
    pluginTypeCheck(),
  ],
})
