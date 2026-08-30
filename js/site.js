(function () {
    "use strict";

    var searchDialog = document.querySelector("[data-search-dialog]");
    var searchInput = document.querySelector("[data-search-input]");
    var searchResults = document.querySelector("[data-search-results]");
    var progressBar = document.querySelector(".reading-progress span");
    var searchIndex;

    var themeButton = document.createElement("button");
    themeButton.type = "button";
    themeButton.className = "reading-theme-toggle";
    themeButton.title = "切换深色模式";
    document.body.appendChild(themeButton);

    function setTheme(isDark) {
        document.body.classList.toggle("dark-theme", isDark);
        themeButton.textContent = isDark ? "☀" : "◐";
        themeButton.setAttribute("aria-label", isDark ? "切换浅色模式" : "切换深色模式");
    }

    var savedTheme = window.localStorage.getItem("reading-theme");
    var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(savedTheme ? savedTheme === "dark" : systemDark);
    themeButton.addEventListener("click", function () {
        var nextDark = !document.body.classList.contains("dark-theme");
        setTheme(nextDark);
        window.localStorage.setItem("reading-theme", nextDark ? "dark" : "light");
    });

    function updateReadingProgress() {
        if (!progressBar) return;
        var scrollable = document.documentElement.scrollHeight - window.innerHeight;
        var progress = scrollable > 0 ? window.scrollY / scrollable : 0;
        progressBar.style.transform = "scaleX(" + Math.min(1, Math.max(0, progress)) + ")";
    }

    updateReadingProgress();
    window.addEventListener("scroll", updateReadingProgress, { passive: true });
    window.addEventListener("resize", updateReadingProgress);

    function openSearch() {
        if (!searchDialog) return;
        searchDialog.hidden = false;
        document.body.classList.add("search-open");
        if (searchInput) {
            searchInput.focus();
            loadSearchIndex();
        }
    }

    function closeSearch() {
        if (!searchDialog) return;
        searchDialog.hidden = true;
        document.body.classList.remove("search-open");
    }

    function loadSearchIndex() {
        if (searchIndex) return;
        fetch("/search.json")
            .then(function (response) { return response.ok ? response.json() : []; })
            .then(function (items) {
                searchIndex = Array.isArray(items) ? items : [];
                renderSearch(searchInput ? searchInput.value : "");
            })
            .catch(function () { searchIndex = []; renderSearch(""); });
    }

    function renderSearch(query) {
        if (!searchResults) return;
        searchResults.textContent = "";
        if (!query.trim()) {
            var hint = document.createElement("p");
            hint.className = "search-empty";
            hint.textContent = "输入关键词开始搜索";
            searchResults.appendChild(hint);
            return;
        }
        var normalized = query.trim().toLowerCase();
        var matches = (searchIndex || []).filter(function (item) {
            return [item.title, item.description, item.categories, item.tags].join(" ").toLowerCase().indexOf(normalized) !== -1;
        }).slice(0, 12);
        if (!matches.length) {
            var empty = document.createElement("p");
            empty.className = "search-empty";
            empty.textContent = "没有找到匹配的文章";
            searchResults.appendChild(empty);
            return;
        }
        matches.forEach(function (item) {
            var link = document.createElement("a");
            link.className = "search-result";
            link.href = item.url;
            var title = document.createElement("strong");
            title.textContent = item.title;
            var meta = document.createElement("small");
            meta.textContent = [item.category, item.date].filter(Boolean).join(" · ");
            link.appendChild(title);
            link.appendChild(meta);
            searchResults.appendChild(link);
        });
    }

    document.querySelectorAll("[data-search-open]").forEach(function (button) {
        button.addEventListener("click", openSearch);
    });
    document.querySelectorAll("[data-search-close]").forEach(function (button) {
        button.addEventListener("click", closeSearch);
    });
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            loadSearchIndex();
            renderSearch(searchInput.value);
        });
    }
    document.addEventListener("keydown", function (event) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            openSearch();
        }
        if (event.key === "Escape") closeSearch();
    });
}());
