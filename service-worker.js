const CACHE_NAME = "ltpf-edutech-v1";

// Liste des fichiers essentiels à stocker pour le mode hors-ligne
const URLS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest", // Correction du nom ici
  "/logo.svg",
  "/icon-192.png",
  "/icon-512.png"
];

// Installation du Service Worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Cache ouvert, stockage des fichiers...");
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Interception des requêtes : on sert le cache en priorité
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Si le fichier est dans le cache, on le donne, sinon on va sur internet
      return response || fetch(event.request);
    })
  );
});

// Nettoyage des anciens caches si tu mets à jour l'app
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});