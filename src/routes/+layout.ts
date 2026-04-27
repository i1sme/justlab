// Чистый SPA: рендерим всё на клиенте, отдаём один и тот же index.html
// для всех маршрутов. Three.js, RDKit и прочее тяжёлое безопасно — нет SSR.
// SEO для приложения с интерактивной 3D-сценой не критичен; вернёмся при необходимости.
export const ssr = false;
export const prerender = false;
