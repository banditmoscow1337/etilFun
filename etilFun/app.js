import {
    createMemo,
    createSignal,
    h,
    render,
    tags
} from "../nano-ui/src/index.js";

const {
    button, div, h1, h2, h3, img, input, label, main, nav, p,
    section, small, span, strong
} = tags;

const products = [
    {
        id: "aperol",
        name: "Aperol",
        kind: "Ликёр",
        origin: "Италия",
        strength: "11%",
        volume: "0,7 л",
        color: "#ef6b2e",
        asset: "./assets/aperol.svg",
        description: "Яркий итальянский аперитив с нотами апельсина, трав и лёгкой благородной горечью.",
        rating: "4.6",
        reviews: "2 018"
    },
    {
        id: "absolut",
        name: "Absolut Vodka",
        kind: "Водка",
        origin: "Швеция",
        strength: "40%",
        volume: "0,7 л",
        color: "#2769b2",
        asset: "./assets/absolut.svg",
        description: "Классическая шведская водка с чистым и мягким вкусом. Отлично подходит для коктейлей и в чистом виде.",
        rating: "4.3",
        reviews: "1 284"
    },
    {
        id: "martini",
        name: "Martini Bianco",
        kind: "Вермут",
        origin: "Италия",
        strength: "15%",
        volume: "1 л",
        color: "#84966c",
        asset: "./assets/martini.svg",
        description: "Мягкий белый вермут с ароматом ванили, цветов и пряных трав.",
        rating: "4.5",
        reviews: "892"
    },
    {
        id: "jameson",
        name: "Jameson",
        kind: "Irish Whiskey",
        origin: "Ирландия",
        strength: "40%",
        volume: "0,7 л",
        color: "#315b39",
        asset: "./assets/jameson.svg",
        description: "Тройная дистилляция делает этот ирландский виски исключительно мягким и сбалансированным.",
        rating: "4.7",
        reviews: "3 421"
    },
    {
        id: "tonic",
        name: "Tonic Water",
        kind: "Тоник",
        origin: "Великобритания",
        strength: "0%",
        volume: "1 л",
        color: "#7da2b6",
        asset: "./assets/tonic.svg",
        description: "Освежающий тоник с чистой цитрусовой нотой и деликатной горчинкой хинина.",
        rating: "4.2",
        reviews: "614"
    }
];

const categories = [
    ["Вино", "wine"], ["Крепкие\nнапитки", "whisky"], ["Пиво", "beer"], ["Коктейли", "cocktail"],
    ["Ликёры", "bottle"], ["Настойки", "bottle"], ["Сидр", "cider"], ["Ещё", "more"]
];

const iconPaths = {
    back: ["M15 18l-6-6 6-6"],
    search: ["M21 21l-4.35-4.35", "M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z"],
    heart: ["M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"],
    more: ["M5 12h.01M12 12h.01M19 12h.01"],
    plus: ["M12 5v14M5 12h14"],
    minus: ["M5 12h14"],
    check: ["M20 6L9 17l-5-5"],
    home: ["M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"],
    grid: ["M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"],
    bag: ["M6 8h12l1 13H5L6 8z", "M9 9V6a3 3 0 0 1 6 0v3"],
    user: ["M20 21a8 8 0 0 0-16 0", "M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
    chevron: ["M9 18l6-6-6-6"],
    wine: ["M8 3h8l-1 7a3 3 0 0 1-6 0L8 3z", "M12 13v8M8 21h8"],
    whisky: ["M6 5h12l-1 15H7L6 5z", "M7 13c3-2 7 2 10 0"],
    beer: ["M7 4h9l-1 17H8L7 4z", "M16 8h2a3 3 0 0 1 0 6h-2"],
    cocktail: ["M4 4h16l-8 9-8-9z", "M12 13v7M8 21h8"],
    bottle: ["M10 3h4v4l2 3v11H8V10l2-3V3z", "M10 12h6"],
    cider: ["M7 5h10l-1 16H8L7 5z", "M8 13h8"],
    star: ["M12 2l3.1 6.28L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.9-1L12 2z"],
    users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"],
    chat: ["M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"],
    x: ["M18 6L6 18M6 6l12 12"]
};

function icon(name, className = "") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", `icon ${className}`.trim());
    (iconPaths[name] || iconPaths.more).forEach((d) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        svg.appendChild(path);
    });
    return svg;
}

const routeFromHash = window.location.hash.replace("#", "");
const [page, setPage] = createSignal(["home", "catalog", "product", "cart", "profile"].includes(routeFromHash) ? routeFromHash : "welcome");
const [selectedId, setSelectedId] = createSignal("absolut");
const [activeFeed, setActiveFeed] = createSignal("recommendations");
const [activeCategory, setActiveCategory] = createSignal("Все");
const [favorites, setFavorites] = createSignal(new Set(["jameson"]));
const [drank, setDrank] = createSignal(false);
const [searchOpen, setSearchOpen] = createSignal(false);
const [searchQuery, setSearchQuery] = createSignal("");
const [cartTab, setCartTab] = createSignal("products");
const [toastMessage, setToastMessage] = createSignal("");
const [cart, setCart] = createSignal([
    { id: "aperol", quantity: 1, by: "Алексей" },
    { id: "martini", quantity: 1, by: "Катя" },
    { id: "jameson", quantity: 1, by: "Дима" },
    { id: "tonic", quantity: 2, by: "Катя" }
]);

const selectedProduct = createMemo(() => products.find((product) => product.id === selectedId()) || products[1]);
const cartCount = createMemo(() => cart().reduce((sum, item) => sum + item.quantity, 0));

let toastTimer;
function toast(message) {
    setToastMessage(message);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToastMessage(""), 2200);
}

function go(next, id) {
    if (id) setSelectedId(id);
    setPage(next);
    history.replaceState(null, "", `#${next}`);
    document.querySelectorAll(".screen-scroll").forEach((node) => { node.scrollTop = 0; });
}

function toggleFavorite(id) {
    setFavorites((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
    toast(favorites().has(id) ? "Добавлено в избранное" : "Удалено из избранного");
}

function addToCart(id) {
    setCart((items) => {
        const found = items.find((item) => item.id === id);
        if (found) return items.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item);
        return [...items, { id, quantity: 1, by: "Вы" }];
    });
    toast("Товар добавлен в общую корзину");
}

function changeQuantity(id, delta) {
    setCart((items) => items
        .map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
        .filter((item) => item.quantity > 0));
}

function statusBar() {
    return div({ class: "status-bar" },
        span({}, "9:41"),
        div({ class: "status-icons", ariaLabel: "Связь, Wi-Fi и батарея" },
            span({ class: "cell-bars" }, "▮▮▮"), span({}, "⌁"), span({ class: "battery" })
        )
    );
}

function phoneShell(content, className = "") {
    return div({ class: `phone ${className}` },
        div({ class: "phone-inner" }, statusBar(), content, div({ class: "home-indicator" }))
    );
}

function iconButton(name, ariaLabel, onClick, active = () => false, extraClass = "") {
    return button({
        class: () => `plain-icon-button ${active() ? "is-active" : ""} ${extraClass}`.trim(),
        type: "button",
        ariaLabel,
        onClick
    }, icon(name));
}

function welcomeScreen({ live = false } = {}) {
    return main({ class: "screen welcome-screen", ariaLabel: "Добро пожаловать в EtilFun" },
        section({ class: "welcome-copy" },
            h1({ class: "welcome-logo" }, "EtilFun"),
            h2({}, "Больше, чем просто напитки"),
            p({}, "Огромный каталог алкоголя,\nваши вкусы, общие корзины\nи новые открытия — всё в одном\nприложении.")
        ),
        div({ class: "welcome-art", ariaHidden: "true" },
            div({ class: "arch arch-one" }),
            div({ class: "arch arch-two" }),
            div({ class: "wine-glass" }, div({ class: "wine-fill" }))
        ),
        div({ class: "welcome-actions" },
            button({ class: "primary-button", type: "button", onClick: () => go("home") }, "Начать"),
            button({ class: "text-button", type: "button", onClick: () => { toast("Добро пожаловать снова!"); go("home"); } },
                "Уже есть аккаунт? ", strong({}, "Войти")
            ),
            live ? small({ class: "demo-hint" }, "Интерактивный прототип") : null
        )
    );
}

function categoryTile([labelText, iconName]) {
    const readable = labelText.replace("\n", " ");
    return button({
        class: "category-tile",
        type: "button",
        onClick: () => { setActiveCategory(readable); go("catalog"); },
        ariaLabel: `Открыть категорию ${readable}`
    }, icon(iconName), span({}, labelText));
}

function productCard(product) {
    return div({
        class: "product-card",
        role: "button",
        tabindex: "0",
        onClick: () => go("product", product.id),
        onKeydown: (event) => {
            if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) {
                event.preventDefault();
                go("product", product.id);
            }
        },
        ariaLabel: `Открыть ${product.name}`
    },
        div({ class: "product-card-visual" },
            img({ src: product.asset, alt: product.name, loading: "lazy" }),
            button({
                class: () => `heart-mini ${favorites().has(product.id) ? "is-active" : ""}`,
                type: "button",
                ariaLabel: "Добавить в избранное",
                onClick: (event) => { event.stopPropagation(); toggleFavorite(product.id); }
            }, icon("heart"))
        ),
        strong({}, product.name),
        small({}, product.kind)
    );
}

function homeScreen() {
    return main({ class: "screen home-screen screen-with-nav" },
        div({ class: "screen-scroll" },
            h("header", { class: "top-header" },
                h1({}, "EtilFun"),
                iconButton("search", "Поиск", () => setSearchOpen(true))
            ),
            nav({ class: "feed-tabs", ariaLabel: "Разделы рекомендаций" },
                [["recommendations", "Рекомендации"], ["popular", "Популярное"], ["new", "Новинки"]].map(([id, title]) =>
                    button({
                        class: () => activeFeed() === id ? "active" : "",
                        type: "button",
                        onClick: () => { setActiveFeed(id); toast(`${title}: подборка обновлена`); }
                    }, title)
                )
            ),
            section({ class: "content-section" },
                div({ class: "section-heading" }, h2({}, "Каталог"), button({ type: "button", onClick: () => go("catalog") }, "Смотреть все")),
                div({ class: "category-grid" }, categories.map(categoryTile))
            ),
            button({ class: "continue-card", type: "button", onClick: () => go("product", "jameson") },
                div({ class: "continue-heading" }, strong({}, "Продолжить исследовать"), icon("chevron")),
                div({ class: "continue-product" },
                    img({ src: "./assets/jameson.svg", alt: "Jameson" }),
                    div({}, strong({}, "Jameson\nIrish Whiskey"), small({}, "☕ Вы добавили в избранное")),
                    span({ class: "round-heart" }, icon("heart"))
                )
            ),
            section({ class: "content-section popular-section" },
                div({ class: "section-heading" }, h2({}, "Популярное сейчас"), button({ type: "button", onClick: () => go("catalog") }, "Смотреть все")),
                div({ class: "product-row" }, products.slice(0, 3).map(productCard))
            )
        ),
        bottomNav("home")
    );
}

function detailScreen() {
    return main({ class: "screen detail-screen" },
        div({ class: "screen-scroll" },
            h("header", { class: "detail-topbar" },
                iconButton("back", "Назад", () => go("home")),
                div({},
                    iconButton("heart", "Избранное", () => toggleFavorite(selectedProduct().id), () => favorites().has(selectedProduct().id)),
                    iconButton("more", "Ещё", () => toast("Ссылка на товар скопирована"))
                )
            ),
            div({ class: "hero-product" }, img({ src: () => selectedProduct().asset, alt: () => selectedProduct().name })),
            section({ class: "detail-content" },
                h1({}, () => selectedProduct().name),
                p({ class: "product-meta" }, () => `${selectedProduct().kind} · ${selectedProduct().origin} · ${selectedProduct().strength}`),
                div({ class: "rating-row" },
                    span({ class: "rating" }, icon("star"), () => `${selectedProduct().rating} (${selectedProduct().reviews} оценки)`),
                    button({ type: "button", onClick: () => toast("Форма отзыва открыта") }, "Оставить отзыв")
                ),
                div({ class: "detail-actions" },
                    button({
                        class: () => `primary-button drank-button ${drank() ? "checked" : ""}`,
                        type: "button",
                        onClick: () => setDrank((value) => !value)
                    }, icon(drank() ? "check" : "plus"), () => drank() ? "Пил(а)" : "Попробовать"),
                    button({ class: "secondary-button", type: "button", onClick: () => addToCart(selectedProduct().id) }, icon("plus"), "В корзину")
                ),
                button({ class: "note-card", type: "button", onClick: () => toast("Заметка сохранена") },
                    span({}, strong({}, "Личная заметка"), small({}, "Например, где пил, с кем и впечатления...")), icon("chevron")
                ),
                articleSection("О напитке", () => selectedProduct().description),
                articleSection("Характеристики", null,
                    div({ class: "spec-row" }, small({}, "Страна"), span({}, () => selectedProduct().origin)),
                    div({ class: "spec-row" }, small({}, "Крепость"), span({}, () => selectedProduct().strength)),
                    div({ class: "spec-row" }, small({}, "Объём"), span({}, () => selectedProduct().volume))
                )
            )
        )
    );
}

function articleSection(title, text, ...children) {
    return section({ class: "article-section" },
        h2({}, title),
        text ? p({}, text) : null,
        children
    );
}

function cartRow(item) {
    const product = products.find((entry) => entry.id === item.id);
    return div({ class: "cart-row" },
        button({ class: "cart-product", type: "button", onClick: () => go("product", product.id) },
            div({ class: "cart-thumb" }, img({ src: product.asset, alt: product.name })),
            div({}, strong({}, product.name), span({}, product.volume), small({}, `♟ Добавил${item.by === "Катя" ? "а" : ""} ${item.by}`))
        ),
        div({ class: "cart-row-actions" },
            iconButton("more", "Действия", () => toast(`${product.name}: меню товара`), () => false, "row-more"),
            div({ class: "quantity" },
                iconButton("minus", "Уменьшить", () => changeQuantity(item.id, -1)),
                span({}, String(item.quantity)),
                iconButton("plus", "Увеличить", () => changeQuantity(item.id, 1))
            )
        )
    );
}

function cartScreen() {
    return main({ class: "screen cart-screen" },
        div({ class: "screen-scroll" },
            h("header", { class: "cart-topbar" },
                iconButton("back", "Назад", () => go("home")),
                iconButton("more", "Настройки корзины", () => toast("Настройки общей корзины"))
            ),
            section({ class: "cart-header" },
                h1({}, "Совместная корзина"),
                h2({}, "Вечеринка у Димы"),
                p({}, "3 участника"),
                div({ class: "avatars" },
                    ["А", "К", "Д"].map((letter) => span({}, letter)),
                    button({ type: "button", ariaLabel: "Пригласить участника", onClick: () => toast("Ссылка-приглашение скопирована") }, icon("plus"))
                )
            ),
            nav({ class: "cart-tabs", ariaLabel: "Корзина и чат" },
                button({ class: () => cartTab() === "products" ? "active" : "", type: "button", onClick: () => setCartTab("products") }, "Товары"),
                button({ class: () => cartTab() === "chat" ? "active" : "", type: "button", onClick: () => setCartTab("chat") }, "Чат")
            ),
            () => cartTab() === "products" ? div({ class: "cart-list" },
                () => cart().length ? cart().map(cartRow) : div({ class: "empty-cart" }, icon("bag"), h2({}, "Корзина пуста"), p({}, "Добавьте напитки для вечеринки"))
            ) : chatPanel()
        ),
        button({ class: "cart-add primary-button", type: "button", onClick: () => go("catalog") }, icon("plus"), () => `Добавить товары · ${cartCount()}`)
    );
}

function chatPanel() {
    return section({ class: "chat-panel" },
        div({ class: "message incoming" }, strong({}, "Катя"), p({}, "Я добавила тоник. Льда хватит?"), small({}, "21:16")),
        div({ class: "message outgoing" }, p({}, "Возьму ещё два пакета 🧊"), small({}, "21:18")),
        label({ class: "chat-input" }, input({ placeholder: "Сообщение...", ariaLabel: "Сообщение" }), button({ type: "button", onClick: () => toast("Сообщение отправлено") }, "↑"))
    );
}

function catalogScreen() {
    const filtered = () => activeCategory() === "Все"
        ? products
        : products.filter((product) => product.kind.toLowerCase().includes(activeCategory().split(" ")[0].toLowerCase())).concat(products).slice(0, 5);

    return main({ class: "screen catalog-screen screen-with-nav" },
        div({ class: "screen-scroll" },
            h("header", { class: "top-header catalog-header" }, h1({}, "Каталог"), iconButton("search", "Поиск", () => setSearchOpen(true))),
            div({ class: "category-pills" }, ["Все", "Вино", "Крепкие", "Ликёры"].map((title) =>
                button({ class: () => activeCategory() === title ? "active" : "", type: "button", onClick: () => setActiveCategory(title) }, title)
            )),
            div({ class: "catalog-grid" }, () => filtered().map(productCard))
        ),
        bottomNav("catalog")
    );
}

function profileScreen() {
    return main({ class: "screen profile-screen screen-with-nav" },
        div({ class: "screen-scroll" },
            h("header", { class: "top-header" }, h1({}, "Профиль"), iconButton("more", "Настройки", () => toast("Настройки профиля"))),
            section({ class: "profile-card" },
                div({ class: "profile-avatar" }, "Н"),
                h2({}, "Никита"), p({}, "Исследователь вкусов"),
                div({ class: "profile-stats" },
                    div({}, strong({}, "24"), small({}, "Пробовал")),
                    div({}, strong({}, () => String(favorites().size)), small({}, "Избранное")),
                    div({}, strong({}, "3"), small({}, "Корзины"))
                )
            ),
            section({ class: "profile-menu" },
                ["Мои оценки", "Избранное", "Совместные корзины", "Настройки"].map((title) =>
                    button({ type: "button", onClick: () => toast(title) }, span({}, title), icon("chevron"))
                )
            )
        ),
        bottomNav("profile")
    );
}

function bottomNav(active) {
    const items = [
        ["home", "Главная", "home"], ["catalog", "Каталог", "search"],
        ["cart", "Корзины", "bag"], ["profile", "Профиль", "user"]
    ];
    return nav({ class: "bottom-nav", ariaLabel: "Основная навигация" }, items.map(([id, title, iconName]) =>
        button({ class: active === id ? "active" : "", type: "button", onClick: () => go(id) },
            div({ class: "nav-icon-wrap" }, icon(iconName), id === "cart" && cartCount() > 0 ? span({ class: "nav-badge" }, () => String(cartCount())) : null),
            small({}, title)
        )
    ));
}

function currentScreen() {
    switch (page()) {
        case "home": return homeScreen();
        case "catalog": return catalogScreen();
        case "product": return detailScreen();
        case "cart": return cartScreen();
        case "profile": return profileScreen();
        default: return welcomeScreen({ live: true });
    }
}

function searchOverlay() {
    return () => searchOpen() ? div({ class: "search-backdrop", onClick: (event) => { if (event.target.classList.contains("search-backdrop")) setSearchOpen(false); } },
        section({ class: "search-panel", role: "dialog", ariaLabel: "Поиск напитков" },
            div({ class: "search-input-row" }, icon("search"), input({
                value: () => searchQuery(),
                placeholder: "Название, категория или страна",
                ariaLabel: "Поисковый запрос",
                autofocus: true,
                onInput: (event) => setSearchQuery(event.target.value)
            }), iconButton("x", "Закрыть", () => setSearchOpen(false))),
            div({ class: "search-results" }, () => {
                const query = searchQuery().trim().toLowerCase();
                const results = products.filter((product) => !query || `${product.name} ${product.kind} ${product.origin}`.toLowerCase().includes(query));
                return results.length ? results.map((product) => button({
                    type: "button",
                    onClick: () => { setSearchOpen(false); go("product", product.id); }
                }, img({ src: product.asset, alt: "" }), span({}, strong({}, product.name), small({}, `${product.kind} · ${product.origin}`)), icon("chevron")))
                    : p({ class: "empty-search" }, "Ничего не найдено. Попробуйте другой запрос.");
            })
        )
    ) : null;
}

function App() {
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setSearchOpen(false);
    });

    return div({ class: "app-stage" },
        section({ class: "showcase", ariaLabel: "Обзор интерфейса EtilFun" },
            phoneShell(welcomeScreen(), "welcome-phone"),
            phoneShell(homeScreen(), "home-phone"),
            phoneShell(detailScreen(), "detail-phone"),
            phoneShell(cartScreen(), "cart-phone")
        ),
        div({ class: "live-app" }, phoneShell(currentScreen, "live-phone")),
        searchOverlay(),
        div({ class: () => `toast ${toastMessage() ? "visible" : ""}`, role: "status" }, () => toastMessage())
    );
}

render(App, document.getElementById("root"));
