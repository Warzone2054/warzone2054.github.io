(function () {
  'use strict';
  const developerMode = location.hostname === "localhost";
  const dataUrl = developerMode ? "posts.json" : "https://fox2code.com/w2054/posts.json";
  let isAdmin = false;
  let data = [];
  let newsElements = [];
  let search = null;
  const dateFormatNews = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function hasMarked() {
    return window.marked && window.marked.parse;
  }
  function updateNewsVisibility() {
    for (let i = 0; i < newsElements.length; i++) {
      const newsEntry = newsElements[i];
      const news = data[i];
      const newsContent = newsEntry.innerHTML;
      const searchValue = search.value.toLowerCase();
      const author = news.author && news.author.toLowerCase() || "";
      const keywords = news.keywords && news.keywords.toLowerCase() || "";
      const content = newsContent.toLowerCase();
      const isVisible = author.equals(searchValue) ||
        keywords.includes(searchValue) || content.includes(searchValue);
      newsEntry.style.display = isVisible ? "block" : "none";
    }
  }
  window.w2054InitializeNews = function (_isAdmin, retry=true) {
    isAdmin = _isAdmin && window.csrfToken !== undefined;
    search = document.getElementById("posts-search");
    if (!search) {
      if (!retry) {
        console.error("Failed to initialize news: search input not found!");
        return;
      }
      setTimeout(function () {
        window.w2054InitializeNews(_isAdmin, false)
      }, 1);
      return;
    }
    search.addEventListener("input", function () {
      updateNewsVisibility()
    })
    const postsList = document.getElementById("posts-list");
    fetch(dataUrl).then(response => response.json()).then(_data => {
      newsElements = []
      data = _data;
      postsList.innerHTML = "";
      for (const news of data) {
        const newsIndex = newsElements.length;
        const newsEntry = document.createElement("div");
        newsEntry.classList.add("news-entry");
        newsEntry.addEventListener('click', function() {
          window.w2054NewsPopup(newsEntry.innerHTML, newsIndex);
        });
        newsElements.push(newsEntry);
        let newsContent;
        if (hasMarked()) {
          newsContent = window.marked.parse(news.content || "null");
        } else {
          newsContent = escapeHtml(news.content);
        }
        const newsContainer = document.createElement("div");
        newsContainer.classList.add("news-content");
        newsContainer.innerHTML = newsContent;
        newsEntry.appendChild(newsContainer);
        const newsDate = document.createElement("div");
        newsDate.classList.add("news-date");
        newsDate.innerText = dateFormatNews.format(news.publishedAt);
        newsEntry.appendChild(newsDate);
        const newsAuthor = document.createElement("div");
        newsAuthor.classList.add("news-author");
        newsAuthor.innerText = "Published by " + news.author;
        newsEntry.appendChild(newsAuthor);
        postsList.appendChild(newsEntry);
      }
    });
  }
  window.w2054NewsPopup = function (htmlContent, newsIndex) {
    console.log("Opening news popup:", htmlContent);
    const popup = new W2054Popup();
    popup.content.push(htmlContent);
    if (isAdmin) {
      popup.addButton("Delete post", `W2054Popup.deletePost(${newsIndex});`);
      popup.eatNewLine();
    }
    popup.open();
  }
  window.W2054Popup.deletePost = function (newsIndex) {
    const popup = new W2054Popup();
    popup.form("action.php");
    popup.text("Are you sure you want to delete this post?");
    popup.newline();
    popup.markdown("__/!\\\\__ This action cannot be undone. __/!\\\\__");
    popup.constant("csrf-token", window.csrfToken);
    popup.constant("action-type", "delete-news");
    popup.constant("news-index", newsIndex);
    popup.open();
  }
})();
