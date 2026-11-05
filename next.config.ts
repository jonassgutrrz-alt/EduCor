import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts", // Origen del Service Worker que crearemos
  swDest: "public/sw.js", // Destino compilado
  disable: process.env.NODE_ENV === "development", // Apagado en dev para evitar problemas de caché rápida
});

const nextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withSerwist(nextConfig);