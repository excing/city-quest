(function () {
  "use strict";

  const DATA = window.CITY_QUEST_DATA;
  const PAGE_FILES = {
    index: "index.html",
    "admin-workbench": "admin-workbench.html",
    "admin-deploy-chest": "admin-deploy-chest.html",
    "admin-open-membership": "admin-open-membership.html",
    "admin-sell-map": "admin-sell-map.html",
    "admin-bundle": "admin-bundle.html",
    "admin-grant-prop": "admin-grant-prop.html",
    "admin-welcome-code": "admin-welcome-code.html",
    welcome: "welcome.html",
    home: "home.html",
    explore: "explore.html",
    encyclopedia: "encyclopedia.html",
    scan: "scan.html",
    "scan-result": "scan-result.html",
    "box-open": "box-open.html",
    inventory: "inventory.html",
    cards: "cards.html",
    quest: "quest.html",
    profile: "profile.html"
  };

  const PAGE_LABELS = {
    index: "原型目录",
    "admin-workbench": "管理工作台",
    "admin-deploy-chest": "投放宝箱",
    "admin-open-membership": "开通/续期会员",
    "admin-sell-map": "售卖解密地图",
    "admin-bundle": "VIP+地图组合",
    "admin-grant-prop": "发放道具",
    "admin-welcome-code": "入口码交付",
    welcome: "欢迎入口",
    home: "首页地图",
    explore: "探索",
    encyclopedia: "百科详情",
    scan: "扫码",
    "scan-result": "扫码结果",
    "box-open": "开箱结果",
    inventory: "背包",
    cards: "图鉴",
    quest: "副本详情",
    profile: "我的"
  };

  const STATES = ["guest", "normal", "pending", "member", "expired", "admin"];
  const TABBAR = [
    ["home", "首页"],
    ["explore", "探索"],
    ["cards", "图鉴"],
    ["inventory", "背包"],
    ["profile", "我的"]
  ];
  const WELCOME_TYPES = ["membership", "map", "bundle"];
  const WELCOME_STATUS_POOL = ["valid", "valid", "done", "invalid"];
  const WELCOME_STATUS_VALUES = ["valid", "done", "invalid"];

  const root = document.getElementById("prototype-root");
  const page = document.body.dataset.page || "index";

  function query() {
    return new URLSearchParams(window.location.search);
  }

  function getState() {
    const params = query();
    const state = params.get("state") || localStorage.getItem("cq-prototype-state") || "member";
    return STATES.includes(state) ? state : "member";
  }

  function currentUser() {
    return DATA.users[getState()] || DATA.users.member;
  }

  function link(target, extra) {
    const params = new URLSearchParams();
    params.set("state", extra && extra.state ? extra.state : getState());
    Object.entries(extra || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== "state") {
        params.set(key, value);
      }
    });
    return `${PAGE_FILES[target] || target}?${params.toString()}`;
  }

  function setState(nextState) {
    localStorage.setItem("cq-prototype-state", nextState);
    const params = query();
    params.set("state", nextState);
    window.location.search = params.toString();
  }

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function badge(text, kind) {
    return `<span class="badge ${kind || ""}">${esc(text)}</span>`;
  }

  function image(src, alt, className) {
    return `<img class="entity-image ${className || ""}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" />`;
  }

  function pageGuide() {
    const state = getState();
    const user = currentUser();
    const userPages = isPublicOnlyState()
      ? ["home", "explore", "encyclopedia", "profile"]
      : state === "pending"
        ? ["welcome", "home", "explore", "encyclopedia", "profile"]
        : state === "expired"
          ? ["home", "explore", "encyclopedia", "inventory", "cards", "quest", "profile"]
          : ["welcome", "home", "explore", "encyclopedia", "scan", "scan-result", "box-open", "inventory", "cards", "quest", "profile"];
    const adminPages = state === "admin"
      ? ["admin-workbench", "admin-deploy-chest", "admin-open-membership", "admin-sell-map", "admin-bundle", "admin-grant-prop", "admin-welcome-code"]
      : [];
    const stateButtons = STATES.map((key) => {
      const active = key === state ? "is-active" : "";
      return `<button class="state-button ${active}" data-action="set-state" data-state="${key}">${DATA.users[key].label}</button>`;
    }).join("");
    const pageLinks = (items) => items.map((key) => {
      const active = key === page ? "is-active" : "";
      return `<a class="${active}" href="${link(key)}"><span>${PAGE_LABELS[key]}</span><span>></span></a>`;
    }).join("");
    const scanLinks = [
      ["welcome", "会员欢迎码", { type: "membership", code: "valid" }],
      ["welcome", "解密地图码", { type: "map", code: "valid" }],
      ["welcome", "组合欢迎码", { type: "bundle", code: "valid" }],
      ["welcome", "已完成欢迎码", { type: "membership", code: "done" }],
      ["welcome", "无效欢迎码", { type: "membership", code: "invalid" }],
      ["scan-result", "实体宝箱码-有效", { scenario: "success" }],
      ["scan-result", "实体宝箱码-定位未授权", { scenario: "location" }],
      ["scan-result", "实体宝箱码-超出范围", { scenario: "range" }],
      ["scan-result", "实体宝箱码-已领取", { scenario: "claimed" }],
      ["scan-result", "实体宝箱码-已领完", { scenario: "empty" }],
      ["scan-result", "实体宝箱码-无效 token", { scenario: "invalid" }]
    ].map(([target, title, extra]) => `
      <a href="${link(target, extra)}"><span>${title}</span><span>扫码</span></a>
    `).join("");

    return `
      <aside class="guide-panel" aria-label="原型控制台">
        <section class="guide-card">
          <h1>我的城市探秘</h1>
          <p>低保真原型。每页是独立 HTML，当前状态会通过 query 和 localStorage 保留。</p>
          <div class="stack-tight">
            ${badge(user.label, state === "expired" ? "signal" : state === "member" || state === "admin" ? "moss" : "")}
            ${user.userCode ? `<span class="utility-code">${esc(user.userCode)}</span>` : ""}
          </div>
        </section>
        <section class="guide-card">
          <h2>状态切换</h2>
          <div class="state-grid">${stateButtons}</div>
        </section>
        <section class="guide-card">
          <h2>用户端页面</h2>
          <div class="page-list">${pageLinks(userPages)}</div>
        </section>
        <section class="guide-card">
          <h2>微信扫码入口</h2>
          <p>先切换状态，再模拟微信扫一扫进入外部小程序码；不代表用户端 Tab 或页面入口。</p>
          <div class="page-list">${scanLinks}</div>
        </section>
        ${adminPages.length ? `
          <section class="guide-card">
            <h2>管理端页面</h2>
            <div class="page-list">${pageLinks(adminPages)}</div>
          </section>
        ` : ""}
      </aside>
    `;
  }

  function phone(content, options) {
    const opts = options || {};
    const tabbar = opts.tabbar === false ? "" : renderTabbar(opts.active || page);
    const bodyClass = opts.bodyClass ? ` ${opts.bodyClass}` : "";
    const noTabClass = opts.tabbar === false ? " no-tabbar" : "";
    const screenLabel = opts.screenLabel || PAGE_LABELS[page] || "原型页面";
    return `
      <section class="phone-shell" aria-label="${esc(screenLabel)}">
        <div class="phone-screen">
          <div class="phone-status"><span>20:26</span><span>${esc(DATA.city.weather)}</span></div>
          <main class="screen-body${noTabClass}${bodyClass}">${content}</main>
          ${tabbar}
        </div>
      </section>
    `;
  }

  function topbar(title, subtitle, right) {
    return `
      <header class="app-topbar">
        <div>
          <h1 class="app-title">${esc(title)}</h1>
          ${subtitle ? `<p class="app-subtitle">${subtitle}</p>` : ""}
        </div>
        ${right || ""}
      </header>
    `;
  }

  function renderTabbar(activePage) {
    const tabs = TABBAR.filter(([key]) => canSeeHistoryAssets() || !["cards", "inventory"].includes(key));
    return `
      <nav class="tabbar" aria-label="底部导航" style="grid-template-columns: repeat(${tabs.length}, 1fr)">
        ${tabs.map(([key, label]) => `
          <a class="${key === activePage ? "is-active" : ""}" href="${link(key)}">
            <span class="tab-icon"></span>
            <span>${label}</span>
          </a>
        `).join("")}
      </nav>
    `;
  }

  function layout(content, options) {
    const opts = options || {};
    root.innerHTML = `
      <div class="prototype-stage">
        ${pageGuide()}
        ${phone(content, opts)}
      </div>
      <div class="modal-backdrop" id="modal-backdrop" role="dialog" aria-modal="true"></div>
      <div class="toast" id="toast"></div>
    `;
  }

  function modal(title, body, actions, options) {
    const opts = options || {};
    const modalRoot = document.getElementById("modal-backdrop");
    modalRoot.innerHTML = `
      <article class="modal-card">
        <h2>${esc(title)}</h2>
        <div class="modal-body">${body}</div>
        <div class="button-row">
          ${(actions || []).join("")}
          ${opts.close === false ? "" : `<button class="secondary-button" data-action="close-modal">关闭</button>`}
        </div>
      </article>
    `;
    modalRoot.classList.add("is-open");
  }

  function closeModal() {
    const modalRoot = document.getElementById("modal-backdrop");
    if (modalRoot) modalRoot.classList.remove("is-open");
  }

  function toast(message) {
    const node = document.getElementById("toast");
    node.textContent = message;
    node.classList.add("is-open");
    window.setTimeout(() => node.classList.remove("is-open"), 1800);
  }

  function statusNotice() {
    const state = getState();
    if (state === "expired") {
      return `<div class="alert">会员已过期。向现场工作人员展示用户码，可线下续期。</div>`;
    }
    if (state === "pending") {
      return `<div class="alert">待开始探索。进入欢迎页后可继续。</div>`;
    }
    if (state === "normal" || state === "guest") {
      return `<div class="alert">当前可浏览公开百科。</div>`;
    }
    return "";
  }

  function memberCanAct() {
    const state = getState();
    return state === "member" || state === "admin";
  }

  function canSeeHistoryAssets() {
    const state = getState();
    return state === "member" || state === "expired" || state === "admin";
  }

  function isPublicOnlyState() {
    const state = getState();
    return state === "guest" || state === "normal";
  }

  function isGuest() {
    return getState() === "guest";
  }

  function hasWelcomeDeepLink() {
    return page === "welcome" && WELCOME_STATUS_VALUES.includes(query().get("code") || "");
  }

  function hidesMemberFeaturePages() {
    const state = getState();
    return state === "guest" || state === "normal" || state === "pending";
  }

  function isPublicEncyclopedia(item) {
    return item.tags.includes("公开");
  }

  function visibleEncyclopedias() {
    return canSeeHistoryAssets()
      ? DATA.encyclopedias
      : DATA.encyclopedias.filter(isPublicEncyclopedia);
  }

  function adminCanAct() {
    return getState() === "admin";
  }

  function publicOnlyFallback() {
    const content = `
      ${topbar("探索", "公开百科", badge(currentUser().label))}
      <section class="panel stack">
        <h3>当前可浏览公开百科</h3>
        <p>从附近百科开始查看城市内容。</p>
        <a class="primary-button" href="${link("explore", { tab: "encyclopedias" })}">查看公开百科</a>
      </section>
    `;
    layout(content, { active: "explore", screenLabel: "探索" });
  }

  function renderAdminBlocked() {
    const content = `
      ${topbar("我的", isGuest() ? "登录与设置" : "用户码与设置", badge(currentUser().label))}
      <section class="panel stack">
        <h3>无管理权限</h3>
        <p>返回首页继续浏览公开百科。</p>
        <a class="primary-button" href="${link("home")}">返回首页</a>
      </section>
    `;
    layout(content, { active: "profile", screenLabel: "我的" });
  }

  function visiblePageLabel() {
    const publicPages = ["index", "home", "explore", "encyclopedia", "profile"];
    const pendingPages = ["index", "welcome", "home", "explore", "encyclopedia", "profile"];
    if (isPublicOnlyState() && hasWelcomeDeepLink()) return PAGE_LABELS[page] || "欢迎入口";
    if (page === "scan-result" && hidesMemberFeaturePages()) return "首页地图";
    if (isPublicOnlyState() && !publicPages.includes(page)) return "探索";
    if (getState() === "pending" && !pendingPages.includes(page)) return "探索";
    if (page.startsWith("admin-") && !adminCanAct()) return "我的";
    return PAGE_LABELS[page] || "原型";
  }

  function renderIndex() {
    const user = currentUser();
    const state = getState();
    const publicOnly = isPublicOnlyState();
    const restricted = hidesMemberFeaturePages();
    const directoryItems = isGuest()
      ? [
          ["home", "首页地图", "公开百科地图"],
          ["explore", "探索", "公开百科列表"],
          ["encyclopedia", "百科详情", "阅读和分享公开内容"],
          ["profile", "我的", "登录入口、设置"]
        ]
      : publicOnly
      ? [
          ["home", "首页地图", "公开百科地图"],
          ["explore", "探索", "公开百科列表"],
          ["encyclopedia", "百科详情", "收藏和分享公开内容"],
          ["profile", "我的", "用户码、收藏、设置"]
        ]
      : getState() === "pending"
        ? [
            ["welcome", "欢迎入口", "进入本人欢迎页"],
            ["home", "首页地图", "公开百科地图"],
            ["explore", "探索", "公开百科列表"],
            ["encyclopedia", "百科详情", "收藏和分享公开内容"],
            ["profile", "我的", "用户码、欢迎入口、设置"]
          ]
      : [
          ["admin-workbench", "管理工作台", "现场高频任务和最近操作"],
          ["admin-open-membership", "开通/续期会员", "用户码、套餐、实收、确认页"],
          ["admin-welcome-code", "入口码交付", "小程序码、有效期、交付动作"],
          ["welcome", "欢迎入口", "会员/解密地图/组合三类欢迎页"],
          ["home", "首页地图", "百科图层、宝箱热区、扫码入口"],
          ["scan", "扫码", "小程序内扫码界面"],
          ["scan-result", "扫码结果", "微信外部码或扫码后结果"],
          ["box-open", "开箱结果", "刻痕扫描、奖励入账"],
          ["inventory", "背包", "宝箱、道具、线索、空箱"]
        ];
    const content = `
      ${topbar("原型目录", restricted ? "公开百科浏览" : "用户会员首探闭环 + 小程序管理员交付链路", badge(user.label, state === "member" || state === "admin" ? "moss" : ""))}
      <section class="panel stack">
        <h3>${restricted ? "当前状态" : "主流程"}</h3>
        <p>${restricted ? "当前只展示可访问页面。" : "管理工作台开通会员，交付入口码；用户扫码进入欢迎页，开始探索，进入首页地图，扫码领取宝箱并开箱入账。"}</p>
        <div class="button-row">
          ${restricted
            ? `${getState() === "pending" ? `<a class="primary-button" href="${link("welcome", { state: "pending", type: "membership", code: "valid" })}">进入欢迎页</a>` : ""}
              <a class="${getState() === "pending" ? "secondary-button" : "primary-button"}" href="${link("explore", { tab: "encyclopedias" })}">查看公开百科</a>`
            : `<a class="primary-button" href="${link("admin-workbench", { state: "admin" })}">从管理端开始</a>
              <a class="secondary-button" href="${link("welcome", { state: "pending", type: "membership", code: "valid" })}">从用户欢迎页开始</a>`}
        </div>
      </section>
      <section class="stack" style="margin-top: 14px">
        ${directoryItems.map(([key, title, desc]) => `
          <a class="list-card" href="${link(key)}">
            <h3>${title}</h3>
            <p>${desc}</p>
          </a>
        `).join("")}
      </section>
    `;
    layout(content, { tabbar: false });
  }

  function renderAdminWorkbench() {
    if (!adminCanAct()) {
      renderAdminBlocked();
      return;
    }
    const content = `
      ${topbar("管理工作台", "今天需要现场确认的事项", badge("超级管理员", "brass"))}
      <section class="stack">
        ${[
          ["admin-deploy-chest", "投放宝箱", "绑定 6 位编号、采集位置、照片和指引"],
          ["admin-open-membership", "开通/续期会员", "选择用户、套餐和备注"],
          ["admin-sell-map", "售卖解密地图", "选择用户和地图"],
          ["admin-bundle", "VIP+地图组合", "会员与地图一起交付"],
          ["admin-grant-prop", "发放道具", "选择道具和数量"]
        ].map(([target, title, desc]) => `
          <a class="list-card" href="${link(target, { state: "admin" })}">
            <div class="split-row"><h3>${title}</h3><span>></span></div>
            <p>${desc}</p>
          </a>
        `).join("")}
      </section>
      <section class="panel" style="margin-top: 14px">
        <div class="section-title">最近操作 <small>只展示摘要</small></div>
        <div class="stack-tight">
          ${DATA.adminOps.map((op) => `<p>${esc(op)}</p>`).join("")}
        </div>
      </section>
    `;
    layout(content, { tabbar: false });
  }

  function adminFormTop(title, subtitle) {
    return `${topbar(title, subtitle, `<a class="badge" href="${link("admin-workbench", { state: "admin" })}">工作台</a>`)}
      ${adminCanAct() ? "" : `<div class="alert">无管理权限。</div>`}`;
  }

  function renderAdminDeployChest() {
    if (!adminCanAct()) {
      renderAdminBlocked();
      return;
    }
    const chest = DATA.chests[0];
    const content = `
      ${adminFormTop("投放宝箱", "绑定已有编号，采集现场信息")}
      <section class="form-panel">
        <div class="field"><label>宝箱 6 位编号</label><input value="${chest.opsCode}" /></div>
        <div class="field"><label>当前位置</label><input value="${DATA.city.center} / ${DATA.city.area}" /></div>
        <div class="field"><label>现场照片</label><input value="photo_wall_01.jpg, photo_env_01.jpg" /></div>
        <div class="field"><label>精确指引</label><textarea>${chest.precise}</textarea></div>
        <button class="primary-button" data-action="confirm-deploy">确认投放</button>
      </section>
    `;
    layout(content, { tabbar: false });
  }

  function renderAdminOpenMembership() {
    if (!adminCanAct()) {
      renderAdminBlocked();
      return;
    }
    const plan = DATA.membershipPlans[0];
    const content = `
      ${adminFormTop("开通/续期会员", "记录线下实收与备注")}
      <section class="form-panel">
        <div class="field"><label>用户码或临时用户</label><input value="CQ-839204 / 林墨" /></div>
        <div class="field"><label>当前会员状态</label><input value="普通用户，无到期时间" /></div>
        <div class="field"><label>套餐</label><select><option>${plan.title} / ${plan.duration} / 赠送罗盘 ${plan.compass}</option><option>${DATA.membershipPlans[1].title}</option></select></div>
        <div class="field"><label>实收金额</label><input value="199" /></div>
        <div class="field"><label>备注</label><textarea>周六现场开通。</textarea></div>
        <button class="primary-button" data-action="confirm-membership">确认开通</button>
      </section>
    `;
    layout(content, { tabbar: false });
  }

  function renderAdminSellMap() {
    if (!adminCanAct()) {
      renderAdminBlocked();
      return;
    }
    const map = DATA.decryptMaps[0];
    const content = `
      ${adminFormTop("售卖解密地图", "选择地图并生成入口码")}
      ${memberCanAct() || adminCanAct() ? "" : `<div class="alert">该用户当前不可开始解密地图。</div>`}
      <section class="form-panel">
        <div class="field"><label>用户码</label><input value="CQ-839204 / 有效会员" /></div>
        <div class="field"><label>解密地图</label><select><option>${map.title} / ${map.area} / ${map.duration}</option></select></div>
        <div class="field"><label>实收金额</label><input value="129" /></div>
        <div class="field"><label>备注</label><textarea>周六现场交付。</textarea></div>
        <button class="primary-button" data-action="confirm-map-sale">生成小程序码</button>
      </section>
    `;
    layout(content, { tabbar: false });
  }

  function renderAdminBundle() {
    if (!adminCanAct()) {
      renderAdminBlocked();
      return;
    }
    const content = `
      ${adminFormTop("VIP+地图组合", "会员与地图一起交付")}
      <section class="form-panel">
        <div class="field"><label>用户或临时用户</label><input value="临时用户：周六游客 A" /></div>
        <div class="field"><label>会员套餐</label><select><option>${DATA.membershipPlans[1].title} / ${DATA.membershipPlans[1].duration}</option></select></div>
        <div class="field"><label>解密地图</label><select><option>${DATA.decryptMaps[0].title}</option></select></div>
        <div class="field"><label>组合实收金额</label><input value="299" /></div>
        <div class="field"><label>备注</label><textarea>周六游客 A。</textarea></div>
        <button class="primary-button" data-action="confirm-bundle">生成小程序码</button>
      </section>
    `;
    layout(content, { tabbar: false });
  }

  function renderAdminGrantProp() {
    if (!adminCanAct()) {
      renderAdminBlocked();
      return;
    }
    const content = `
      ${adminFormTop("发放道具", "填写数量和备注")}
      <section class="form-panel">
        <div class="field"><label>用户码</label><input value="CQ-839204 / 林墨" /></div>
        <div class="field"><label>道具</label><select><option>寻宝罗盘</option></select></div>
        <div class="field"><label>数量</label><input value="2" /></div>
        <div class="field"><label>备注</label><textarea>线下活动补发。</textarea></div>
        <button class="primary-button" data-action="confirm-grant">确认发放</button>
      </section>
    `;
    layout(content, { tabbar: false });
  }

  function renderAdminWelcomeCode() {
    if (!adminCanAct()) {
      renderAdminBlocked();
      return;
    }
    const type = query().get("type") || "membership";
    const code = DATA.welcomeCodes[type] || DATA.welcomeCodes.membership;
    const content = `
      ${adminFormTop("入口码交付", "交付给用户")}
      <section class="panel stack">
        <div class="split-row">
          <div>
            <h3>${esc(code.title)}</h3>
            <p>${esc(code.subtitle)}</p>
          </div>
          ${badge(type === "bundle" ? "组合码" : type === "map" ? "地图码" : "会员码", "brass")}
        </div>
        <div class="qr-box">WC-8F23</div>
        <p>有效期至 ${esc(code.expiresAt)}。</p>
        <div class="button-row">
          <button class="secondary-button" data-action="toast" data-message="已保存小程序码">保存小程序码</button>
          <a class="secondary-button" href="${link("welcome", { state: "guest", type, code: "valid" })}">未登录扫码</a>
          <a class="primary-button" href="${link("welcome", { state: "normal", type, code: "valid" })}">已登录扫码</a>
        </div>
      </section>
    `;
    layout(content, { tabbar: false });
  }

  function renderWelcome() {
    if (isPublicOnlyState() && !hasWelcomeDeepLink()) {
      publicOnlyFallback();
      return;
    }
    const requestedType = query().get("type");
    const requestedStatus = query().get("code");
    const type = WELCOME_TYPES.includes(requestedType) ? requestedType : WELCOME_TYPES[Math.floor(Math.random() * WELCOME_TYPES.length)];
    const status = WELCOME_STATUS_VALUES.includes(requestedStatus) ? requestedStatus : WELCOME_STATUS_POOL[Math.floor(Math.random() * WELCOME_STATUS_POOL.length)];
    const code = DATA.welcomeCodes[type] || DATA.welcomeCodes.membership;
    const blockedMapCode = type === "map" && status !== "invalid" && !memberCanAct();
    if (blockedMapCode) {
      const content = `
        ${topbar("探秘入口", "无法进入", badge("不可用", "signal"))}
        <section class="panel stack" style="margin-top: 12px">
          <h3>无法进入该探秘入口</h3>
          <p>返回首页继续浏览公开百科。</p>
          <button class="secondary-button" data-action="go" data-target="home">返回首页</button>
        </section>
      `;
      layout(content, { tabbar: false, screenLabel: "欢迎入口" });
      if (isGuest()) {
        modal("微信授权登录", "授权后将继续校验这张入口码。", [
          `<button class="primary-button" data-action="set-state" data-state="normal">授权登录</button>`
        ], { close: false });
      }
      return;
    }
    const typeLabel = type === "membership" ? "会员入口码" : type === "map" ? "解密地图码" : "组合入口码";
    const buttonText = status === "done" ? "继续探索" : code.button;
    const disabled = status === "invalid";
    const content = `
      ${topbar(code.title, code.subtitle, badge(typeLabel, status === "invalid" ? "signal" : "brass"))}
      <section class="scan-stage" style="margin-top: 12px">
        ${image(code.coverUrl, `${code.title}封面`, "cover-image")}
      </section>
      <section class="panel stack" style="margin-top: 12px">
        <p>${esc(code.description)}</p>
        <p class="utility-code">有效期 ${esc(code.expiresAt)}</p>
        ${status === "invalid" ? `<div class="alert">无法进入该探秘入口。</div>` : ""}
        <button class="${disabled ? "secondary-button" : "primary-button"}" data-action="${disabled ? "go" : "start-welcome"}" data-target="home" data-message="无法进入该探秘入口" data-type="${type}" data-status="${status}">
          ${disabled ? "返回首页" : buttonText}
        </button>
      </section>
    `;
    layout(content, { tabbar: false });
    if (isGuest()) {
      modal("微信授权登录", "授权后将继续校验这张入口码。", [
        `<button class="primary-button" data-action="set-state" data-state="normal">授权登录</button>`
      ], { close: false });
    }
  }

  function renderHome() {
    const state = getState();
    const canSeeChests = memberCanAct();
    const requestedLayer = query().get("layer") || "encyclopedia";
    const layer = canSeeChests ? requestedLayer : "encyclopedia";
    const homeBadge = isPublicOnlyState() ? "公开百科" : currentUser().membership;
    const homeBadgeKind = state === "expired" ? "signal" : isPublicOnlyState() ? "" : "moss";
    const content = `
      <section class="map-board home-map">
        <div class="home-map-top">
          <div>
            <h1 class="home-city">城市 ${esc(DATA.city.name)}</h1>
            <p>${esc(DATA.city.area)} / 手动切换城市</p>
          </div>
          ${badge(homeBadge, homeBadgeKind)}
        </div>
        ${state === "expired" || state === "pending" ? `<div class="home-map-notice">${statusNotice()}</div>` : ""}
        ${canSeeChests ? `
          <div class="home-layer-control segmented">
            <button class="${layer === "encyclopedia" ? "is-active" : ""}" data-action="set-query" data-key="layer" data-value="encyclopedia">百科</button>
            <button class="${layer === "chests" ? "is-active" : ""}" data-action="set-query" data-key="layer" data-value="chests">宝箱热区</button>
          </div>
        ` : ""}
        <span class="map-label" style="left: 24px; top: 206px">武康路</span>
        <span class="map-label" style="right: 26px; top: 292px">复兴西路</span>
        ${layer === "chests" && canSeeChests ? `
          <button class="map-point chest" style="left: 54%; top: 30%" data-action="modal-chest" aria-label="宝箱热区"></button>
          <button class="map-point chest" style="left: 28%; top: 52%" data-action="modal-chest-unlocked" aria-label="已解锁宝箱"></button>
        ` : `
          <button class="map-point" style="left: 34%; top: 26%" data-action="modal-encyclopedia" aria-label="百科点"></button>
          <button class="map-point" style="left: 66%; top: 48%" data-action="modal-encyclopedia" aria-label="百科点"></button>
          <button class="map-point" style="left: 48%; top: 65%" data-action="modal-encyclopedia" aria-label="百科点"></button>
        `}
        ${layer === "chests" && !canSeeChests ? `<div class="map-drawer"><strong>当前不可查看</strong><p>返回百科地图继续探索。</p></div>` : `
          <div class="map-drawer">
            <div class="section-title">${layer === "chests" ? "附近宝箱热区" : "附近百科"} <small>${layer === "chests" ? "漂移坐标" : "公开内容"}</small></div>
            <p>${layer === "chests" ? DATA.chests[0].area + " / " + DATA.chests[0].displayDistance : DATA.encyclopedias[0].title + " / " + DATA.encyclopedias[0].distance}</p>
          </div>
        `}
        ${canSeeChests ? `<button class="scan-button" data-action="go" data-target="scan">扫码</button>` : ""}
      </section>
    `;
    layout(content, { active: "home", bodyClass: "home-screen", screenLabel: "首页地图" });
  }

  function renderExplore() {
    const state = getState();
    const canMember = memberCanAct();
    const isExpired = state === "expired";
    const availableTabs = canMember
      ? [["chests", "宝箱"], ["encyclopedias", "百科"], ["quests", "副本"], ["clues", "线索"]]
      : isExpired
        ? [["encyclopedias", "百科"], ["quests", "副本"], ["clues", "线索"]]
        : [["encyclopedias", "百科"]];
    const requestedTab = query().get("tab") || "encyclopedias";
    const tab = availableTabs.some(([key]) => key === requestedTab) ? requestedTab : "encyclopedias";
    const tabs = availableTabs.length > 1
      ? `<div class="segmented">${availableTabs.map(([key, label]) => `<button class="${tab === key ? "is-active" : ""}" data-action="set-query" data-key="tab" data-value="${key}">${label}</button>`).join("")}</div>`
      : "";
    let list = "";
    if (tab === "encyclopedias") {
      list = visibleEncyclopedias().map((item) => `
        <a class="list-card media-card" href="${link("encyclopedia", { id: item.id })}">
          ${image(item.coverUrl, item.title, "thumb-image")}
          <div>
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.summary)}</p>
            <div class="meta-row">${item.tags.map((tag) => badge(tag)).join("")}${badge(item.distance, "moss")}</div>
          </div>
        </a>
      `).join("");
    } else if (tab === "chests") {
      list = canMember ? DATA.chests.map((item) => `
        <article class="list-card">
          <div class="split-row"><h3>${esc(item.area)}宝箱热区</h3>${badge(item.unlocked ? "已用罗盘" : "未解锁", item.unlocked ? "brass" : "")}</div>
          <p>${esc(item.displayDistance)} / ${esc(item.drift)}</p>
          <div class="button-row">
            <button class="secondary-button" data-action="${item.unlocked ? "modal-guide" : "modal-compass"}">${item.unlocked ? "查看指引" : "使用罗盘"}</button>
            <a class="primary-button" href="${link("scan")}">扫码验证</a>
          </div>
        </article>
      `).join("") : `<div class="empty-state">当前没有可探索宝箱。</div>`;
    } else if (tab === "quests") {
      list = canMember || isExpired ? DATA.quests.map((quest) => `
        <a class="list-card" href="${link("quest", { id: quest.id })}">
          <div class="split-row"><h3>${esc(quest.title)}</h3>${badge(isExpired ? "历史只读" : quest.status, isExpired ? "signal" : "moss")}</div>
          <p>${esc(quest.area)} / ${esc(quest.difficulty)} / 进度 ${esc(quest.progress)}</p>
        </a>
      `).join("") : `<div class="empty-state">暂无副本。</div>`;
    } else {
      list = canMember || isExpired ? DATA.inventory.clues.map((clue) => `
        <article class="list-card">
          <h3>${esc(clue.title)}</h3>
          <p>${esc(clue.quest)} / ${esc(clue.status)}</p>
          <div class="button-row"><button class="secondary-button" data-action="modal-compass">使用罗盘</button></div>
        </article>
      `).join("") : `<div class="empty-state">还没有解锁线索。</div>`;
    }
    const content = `
      ${topbar("探索", hidesMemberFeaturePages() ? "搜索公开百科、区域和标签" : "搜索城市内容、区域、标签和状态", badge(DATA.city.area))}
      ${state === "expired" || state === "pending" ? statusNotice() : ""}
      <section class="form-panel" style="margin: 10px 0">
        <div class="field"><label>搜索</label><input value="武康路 门牌" /></div>
      </section>
      ${tabs}
      <section class="stack" style="margin-top: 12px">${list}</section>
    `;
    layout(content, { active: "explore" });
  }

  function renderEncyclopedia() {
    const entries = visibleEncyclopedias();
    const item = entries.find((entry) => entry.id === query().get("id")) || entries[0] || DATA.encyclopedias[0];
    const favoriteText = isGuest() ? "登录后收藏" : "收藏";
    const content = `
      ${topbar(item.title, `${item.area} / ${item.distance}`, badge(item.tags[0]))}
      ${image(item.coverUrl, item.title, "hero-image")}
      <section class="panel stack" style="margin-top: 12px">
        <p>${esc(item.summary)} 这里记录街角立面、旧路牌和可观察的城市细节。</p>
        <div class="button-row">
          <button class="secondary-button" data-action="favorite">${favoriteText}</button>
          <button class="secondary-button" data-action="toast" data-message="已转发给好友">分享</button>
        </div>
      </section>
    `;
    layout(content, { active: "explore" });
  }

  function renderScan() {
    if (!memberCanAct()) {
      publicOnlyFallback();
      return;
    }
    const content = `
      ${topbar("扫码", "对准小程序码", badge("相机", "brass"))}
      <section class="scan-stage scanner-stage">
        <div class="scanner-frame">
          <span></span><span></span><span></span><span></span>
        </div>
      </section>
      <section class="panel stack" style="margin-top: 12px">
        <div class="button-row">
          <a class="primary-button" href="${link("scan-result", { scenario: "success" })}">实体宝箱码</a>
          <a class="secondary-button" href="${link("welcome", { type: "membership", code: "valid" })}">会员欢迎码</a>
          <a class="secondary-button" href="${link("welcome", { type: "map", code: "valid" })}">解密地图码</a>
          <a class="secondary-button" href="${link("welcome", { type: "bundle", code: "valid" })}">组合欢迎码</a>
          <a class="secondary-button" href="${link("scan-result", { scenario: "invalid" })}">无效码</a>
        </div>
      </section>
    `;
    layout(content, { tabbar: false });
  }

  function renderScanResult() {
    const scenarioOptions = ["success", "success", "location", "range", "claimed", "empty", "invalid"];
    const requestedScenario = query().get("scenario");
    const scenario = requestedScenario || scenarioOptions[Math.floor(Math.random() * scenarioOptions.length)];
    const state = getState();
    if (state === "guest" || state === "normal" || state === "pending") {
      renderHome();
      return;
    }

    let body = "";
    if (state === "expired") {
      body = `<section class="panel result-card result-card-fail stack">
        <div class="result-mark">!</div>
        <h3>会员已过期</h3>
        <p>向现场工作人员展示用户码，可线下续期。</p>
        <p class="utility-code">${currentUser().userCode}</p>
        <button class="secondary-button" data-action="go" data-target="home">返回首页</button>
      </section>`;
    } else if (scenario === "success") {
      body = `<section class="panel result-card result-card-success stack">
        <div class="result-mark">OK</div>
        <h3>找到一个城市宝箱</h3>
        <p>距离 7m / 领取范围 10m。</p>
        <div class="detail-grid">
          <div class="detail-stat"><span>当前位置</span><strong>范围内</strong></div>
          <div class="detail-stat"><span>领取状态</span><strong>可领取</strong></div>
        </div>
        <div class="button-row">
          <button class="secondary-button" data-action="claim-box">加入背包</button>
          <a class="primary-button" href="${link("box-open")}">立即打开</a>
        </div>
      </section>`;
    } else {
      const messages = {
        location: {
          title: "需要开启定位后才能领取",
          detail: "开启定位后可继续校验领取范围。",
          button: "去开启定位",
          action: "toast",
          target: "",
          message: "已打开定位设置"
        },
        range: {
          title: "当前位置不在领取范围内",
          detail: "回到地图附近后可重新扫码。",
          button: "返回首页",
          action: "go",
          target: "home"
        },
        claimed: {
          title: "你已领取过这个宝箱",
          detail: "可在背包中查看领取记录。",
          button: "查看背包",
          action: "go",
          target: "inventory"
        },
        empty: {
          title: "这个宝箱已被领取完",
          detail: "返回地图继续探索其他地点。",
          button: "继续探索",
          action: "go",
          target: "home"
        },
        invalid: {
          title: "宝箱不存在或已失效",
          detail: "返回地图继续探索。",
          button: "返回首页",
          action: "go",
          target: "home"
        }
      };
      const current = messages[scenario] || messages.invalid;
      body = `<section class="panel result-card result-card-fail stack">
        <div class="result-mark">!</div>
        <h3>${current.title}</h3>
        <p>${current.detail}</p>
        <button class="secondary-button" data-action="${current.action}" data-target="${current.target}" data-message="${current.message || current.title}">${current.button}</button>
      </section>`;
    }
    const content = `${topbar("扫码结果", "线下宝箱", badge(scenario === "success" && memberCanAct() ? "可领取" : "结果", scenario === "success" && memberCanAct() ? "moss" : "signal"))}${body}`;
    layout(content, { tabbar: false });
  }

  function renderBoxOpen() {
    if (hidesMemberFeaturePages()) {
      publicOnlyFallback();
      return;
    }
    if (!memberCanAct()) {
      const state = getState();
      const content = `
        ${topbar("开箱结果", "当前没有可打开的宝箱", badge(currentUser().label, state === "expired" ? "signal" : ""))}
        <section class="panel stack">
          <h3>${state === "expired" ? "会员已过期" : "暂无开箱记录"}</h3>
          <p>${state === "expired" ? "向现场工作人员展示用户码，可线下续期。" : "返回首页继续探索公开百科。"}</p>
          <a class="primary-button" href="${link("explore", { tab: "encyclopedias" })}">查看公开百科</a>
        </section>
      `;
      layout(content, { tabbar: false });
      return;
    }
    const content = `
      ${topbar("开箱结果", "收获已入账", badge("可跳过", "brass"))}
      <section class="open-stage">
        <div class="panel" style="width: 76%; text-align: center">
          <h3>收获已入账</h3>
          <p>图鉴和道具已加入背包。</p>
        </div>
      </section>
      <section class="stack" style="margin-top: 12px">
        <article class="list-card"><h3>图鉴：城市记忆</h3><p>海派建筑 / 普通 / 已加入图鉴墙</p></article>
        <article class="list-card"><h3>道具：寻宝罗盘 x1</h3><p>可查看一处精确指引</p></article>
      </section>
      <div class="button-row">
        <a class="secondary-button" href="${link("inventory")}">查看背包</a>
        <a class="primary-button" href="${link("home")}">继续探索</a>
      </div>
    `;
    layout(content, { tabbar: false });
  }

  function renderInventory() {
    if (hidesMemberFeaturePages()) {
      publicOnlyFallback();
      return;
    }
    if (!canSeeHistoryAssets()) {
      const content = `
        ${topbar("背包", "暂无可查看内容", badge(currentUser().label))}
        <section class="panel stack">
          <h3>背包为空</h3>
          <p>返回首页继续浏览公开百科。</p>
          <a class="primary-button" href="${link("explore", { tab: "encyclopedias" })}">查看公开百科</a>
        </section>
      `;
      layout(content, { active: "explore" });
      return;
    }
    const tab = query().get("tab") || "boxes";
    const tabs = [
      ["boxes", "宝箱"],
      ["props", "道具"],
      ["clues", "线索"],
      ["empty", "空箱"]
    ].map(([key, label]) => `<button class="${tab === key ? "is-active" : ""}" data-action="set-query" data-key="tab" data-value="${key}">${label}</button>`).join("");
    const isExpired = getState() === "expired";
    let list = "";
    if (tab === "boxes") {
      list = DATA.inventory.boxes.map((item) => `
        <article class="list-card">
          <div class="split-row"><h3>${esc(item.title)}</h3>${badge(item.status, item.status === "未打开" ? "brass" : "")}</div>
          <p>${esc(item.source)} / ${esc(item.obtainedAt)}</p>
          ${item.status === "未打开" ? `<div class="button-row"><button class="primary-button" data-action="${memberCanAct() ? "go" : "expired-open"}" data-target="box-open">打开宝箱</button></div>` : ""}
        </article>
      `).join("");
    } else if (tab === "props") {
      list = DATA.inventory.props.map((item) => `
        <article class="list-card"><h3>${esc(item.title)} x${item.count}</h3><p>${esc(item.detail)}</p></article>
      `).join("");
    } else if (tab === "clues") {
      list = DATA.inventory.clues.map((item) => `
        <article class="list-card"><h3>${esc(item.title)}</h3><p>${esc(item.quest)} / ${esc(item.status)}</p></article>
      `).join("");
    } else {
      list = DATA.inventory.empty.map((item) => `
        <article class="list-card"><h3>${esc(item.title)}</h3><p>${esc(item.source)} / ${esc(item.obtainedAt)}</p></article>
      `).join("");
    }
    const content = `
      ${topbar("背包", "宝箱、道具、线索、空箱", badge(isExpired ? "历史只读" : "会员资产", isExpired ? "signal" : "moss"))}
      ${statusNotice()}
      <div class="segmented" style="margin: 10px 0">${tabs}</div>
      <section class="stack">${list || `<div class="empty-state">暂无内容。</div>`}</section>
    `;
    layout(content, { active: "inventory" });
  }

  function renderCards() {
    if (hidesMemberFeaturePages()) {
      publicOnlyFallback();
      return;
    }
    if (!canSeeHistoryAssets()) {
      const content = `
        ${topbar("图鉴", "暂无可查看内容", badge(currentUser().label))}
        <section class="panel stack">
          <h3>还没有获得图鉴</h3>
          <p>返回首页继续浏览公开百科。</p>
          <a class="primary-button" href="${link("explore", { tab: "encyclopedias" })}">查看公开百科</a>
        </section>
      `;
      layout(content, { active: "explore" });
      return;
    }
    const filter = query().get("filter") || "all";
    const filters = [
      ["all", "全部"],
      ["rare", "稀有"],
      ["missing", "未获得"]
    ].map(([key, label]) => `<button class="${filter === key ? "is-active" : ""}" data-action="set-query" data-key="filter" data-value="${key}">${label}</button>`).join("");
    const cards = DATA.cards.filter((card) => {
      if (filter === "rare") return card.rarity !== "普通";
      if (filter === "missing") return !card.owned;
      return true;
    });
    const content = `
      ${topbar("图鉴", "系列进度 海派建筑 2/4", badge(getState() === "expired" ? "历史可见" : "图鉴墙", "brass"))}
      <div class="segmented" style="margin-bottom: 12px">${filters}</div>
      <section class="grid-cards">
        ${cards.map((card) => `
          <article class="card-tile ${card.owned ? "" : "is-missing"}" data-action="modal-card" data-card-id="${esc(card.id)}" tabindex="0" role="button" aria-label="查看${esc(card.owned ? card.title : "未获得图鉴")}详情">
            <div class="card-art">${image(card.imageUrl, card.title)}</div>
            <h3>${card.owned ? esc(card.title) : "图鉴剪影"}</h3>
            <p>${esc(card.series)} / ${esc(card.rarity)}</p>
            <div class="meta-row">${badge(card.no)}</div>
          </article>
        `).join("")}
      </section>
    `;
    layout(content, { active: "cards" });
  }

  function renderQuest() {
    if (hidesMemberFeaturePages()) {
      publicOnlyFallback();
      return;
    }
    if (!memberCanAct() && getState() !== "expired") {
      const content = `
        ${topbar("副本详情", "暂无可查看内容", badge(currentUser().label))}
        <section class="panel stack">
          <h3>暂无副本进度</h3>
          <p>返回首页继续浏览公开百科。</p>
          <a class="primary-button" href="${link("explore", { tab: "encyclopedias" })}">查看公开百科</a>
        </section>
      `;
      layout(content, { active: "explore" });
      return;
    }
    const quest = DATA.quests[0];
    const readOnly = getState() === "expired";
    const locked = !memberCanAct() && !readOnly;
    const content = `
      ${topbar(quest.title, `${quest.area} / ${quest.difficulty} / ${quest.unlockMode}`, badge(readOnly ? "历史只读" : quest.status, readOnly ? "signal" : "moss"))}
      ${statusNotice()}
      <section class="panel">
        <div class="section-title">线索时间线 <small>${quest.progress}</small></div>
        <div class="timeline">
          ${quest.clues.map((clue) => `
            <div class="timeline-item">
              <span class="timeline-dot ${clue.status === "已完成" ? "done" : clue.status === "进行中" ? "current" : ""}"></span>
              <div><strong>${esc(clue.title)}</strong><p>${esc(clue.status)}</p></div>
            </div>
          `).join("")}
        </div>
      </section>
      <section class="form-panel" style="margin-top: 12px">
        <div class="field"><label>答案</label><input value="1934" ${locked || readOnly ? "disabled" : ""} /></div>
        <div class="button-row">
          <button class="primary-button" data-action="${locked ? "toast" : readOnly ? "toast" : "answer"}" data-message="${locked ? "开始探索后可使用副本能力" : "历史只读状态不可提交答案"}">提交答案</button>
          <button class="secondary-button" data-action="${locked || readOnly ? "toast" : "modal-compass"}" data-message="${readOnly ? "会员已过期，续期后可继续使用" : "开始探索后可使用罗盘"}">使用罗盘</button>
        </div>
      </section>
    `;
    layout(content, { active: "explore" });
  }

  function renderProfile() {
    const user = currentUser();
    const state = getState();
    const publicOnly = isPublicOnlyState();
    const profileSubtitle = isGuest() ? "登录与设置" : publicOnly ? "用户码与设置" : "用户码、会员状态和管理入口";
    const profileBadgeKind = state === "expired" ? "signal" : state === "member" || state === "admin" ? "moss" : "";
    const content = `
      ${topbar("我的", profileSubtitle, badge(user.label, profileBadgeKind))}
      ${isGuest() ? `
        <section class="panel stack">
          <h3>未登录</h3>
          <p>登录后可保存喜欢的内容。</p>
          <button class="primary-button" data-action="set-state" data-state="normal">微信登录</button>
        </section>
      ` : `
        <section class="panel stack">
          <div class="split-row">
            <div><h3>${esc(user.name)}</h3><p>${publicOnly ? "公开百科" : esc(user.membership)}</p></div>
            <span class="utility-code">${esc(user.userCode)}</span>
          </div>
          ${publicOnly ? "" : `<p>到期时间：${esc(user.expiresAt || "无")}</p>`}
          ${memberCanAct() || state === "expired" || state === "pending" ? `<p>寻宝罗盘：${esc(user.compass)} 个</p>` : ""}
          ${state === "pending" ? `<a class="primary-button" href="${link("welcome", { state: "pending", type: "membership", code: "valid" })}">进入会员欢迎页</a>` : ""}
          ${state === "expired" ? `<div class="alert">会员已过期。向现场工作人员展示用户码，可线下续期。</div>` : ""}
        </section>
      `}
      <section class="stack" style="margin-top: 12px">
        ${isGuest() ? "" : `<a class="list-card" href="${link("encyclopedia")}"><h3>收藏百科</h3><p>武康大楼的转角、旧路牌上的法租界痕迹</p></a>`}
        ${state === "admin" ? `<a class="list-card" href="${link("admin-workbench", { state: "admin" })}"><h3>管理工作台</h3><p>投放宝箱、开通会员、交付入口码</p></a>` : ""}
        <article class="list-card"><h3>账号与隐私</h3><p>设置、协议、隐私政策</p></article>
      </section>
    `;
    layout(content, { active: "profile" });
  }

  function wireEvents() {
    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-action]");
      if (!target) return;
      const action = target.dataset.action;
      if (action !== "modal-card") event.preventDefault();

      if (action === "set-state") {
        setState(target.dataset.state);
      } else if (action === "set-query") {
        const params = query();
        params.set(target.dataset.key, target.dataset.value);
        params.set("state", getState());
        window.location.search = params.toString();
      } else if (action === "go") {
        window.location.href = link(target.dataset.target || "home");
      } else if (action === "toast") {
        toast(target.dataset.message || "已完成");
      } else if (action === "close-modal") {
        closeModal();
      } else if (action === "confirm-deploy") {
        modal("确认投放", "编号 184206。请核对位置、照片和指引。", [
          `<a class="primary-button" href="${link("admin-workbench", { state: "admin" })}">提交</a>`
        ]);
      } else if (action === "confirm-membership") {
        modal("确认开通", "用户 CQ-839204。周末城市探秘，赠送寻宝罗盘 3 个。", [
          `<a class="primary-button" href="${link("admin-welcome-code", { state: "admin", type: "membership" })}">生成小程序码</a>`
        ]);
      } else if (action === "confirm-map-sale") {
        modal("确认解密地图", "CQ-839204。消失的弄堂门牌。", [
          `<a class="primary-button" href="${link("admin-welcome-code", { state: "admin", type: "map" })}">生成小程序码</a>`
        ]);
      } else if (action === "confirm-bundle") {
        modal("确认组合权益", "月度城市探秘 + 消失的弄堂门牌。", [
          `<a class="primary-button" href="${link("admin-welcome-code", { state: "admin", type: "bundle" })}">生成小程序码</a>`
        ]);
      } else if (action === "confirm-grant") {
        modal("确认发放", "为 CQ-839204 发放寻宝罗盘 x2。", [
          `<button class="primary-button" data-action="close-modal">完成</button>`
        ]);
      } else if (action === "start-welcome") {
        const type = target.dataset.type || "membership";
        if (target.dataset.status === "invalid") {
          toast("无法进入该探秘入口");
        } else if (type === "membership") {
          window.location.href = link("home", { state: "member" });
        } else if (type === "map" && !memberCanAct()) {
          modal("无法进入该探秘入口", "返回首页继续浏览公开百科。", [
            `<button class="primary-button" data-action="go" data-target="home">返回首页</button>`
          ]);
        } else {
          window.location.href = link("quest", { state: "member" });
        }
      } else if (action === "modal-chest") {
        modal("宝箱热区", "附近有宝箱线索。使用罗盘查看精确指引。", [
          `<button class="primary-button" data-action="modal-compass">使用罗盘</button>`
        ]);
      } else if (action === "modal-chest-unlocked" || action === "modal-guide") {
        modal("精确指引", "真实坐标 31.2104, 121.4387。花砖墙右侧第三块铜牌下方。", []);
      } else if (action === "modal-encyclopedia") {
        modal("附近百科", "武康大楼的转角。公开百科可直接浏览和分享。", [
          `<a class="primary-button" href="${link("encyclopedia")}">查看百科</a>`
        ]);
      } else if (action === "modal-compass") {
        if (!memberCanAct()) {
          modal("当前不可使用", "返回首页继续探索公开百科。", []);
        } else {
          modal("使用寻宝罗盘", "将消耗 1 个寻宝罗盘。", [
            `<button class="primary-button" data-action="toast" data-message="已解锁精确指引">确认使用</button>`
          ]);
        }
      } else if (action === "favorite") {
        if (getState() === "guest") {
          modal("登录后收藏", "公开百科仍可继续浏览和分享。", [
            `<button class="primary-button" data-action="set-state" data-state="normal">微信登录</button>`
          ]);
        } else {
          toast("已收藏百科");
        }
      } else if (action === "claim-box") {
        toast("已加入背包");
      } else if (action === "expired-open") {
        modal("会员已过期", "向现场工作人员展示用户码，可线下续期。", []);
      } else if (action === "answer") {
        modal("答案正确", "线索已标记完成，副本进度更新为 3/5。", []);
      } else if (action === "modal-card") {
        const cardId = target.closest("[data-card-id]")?.dataset.cardId;
        const card = DATA.cards.find((item) => item.id === cardId) || DATA.cards[0];
        const title = card.owned ? card.title : "未获得图鉴";
        const detail = `
          <section class="card-detail ${card.owned ? "" : "is-missing"}">
            ${image(card.imageUrl, card.title, "card-detail-image")}
            <div class="detail-grid">
              <div class="detail-stat"><span>所属系列</span><strong>${esc(card.series)}</strong></div>
              <div class="detail-stat"><span>等级</span><strong>${esc(card.rarity)}</strong></div>
              <div class="detail-stat"><span>系列进度</span><strong>${esc(card.seriesProgress)}</strong></div>
              <div class="detail-stat"><span>编号</span><strong>${esc(card.no)}</strong></div>
            </div>
            <p class="detail-copy">${esc(card.description)}</p>
            <div class="list-card">
              <h3>${card.owned ? "获得记录" : "获得状态"}</h3>
              <p>${card.owned ? `${esc(card.source)} / ${esc(card.obtainedAt)}` : "还没有获得。打开宝箱或完成副本后会点亮收藏。"}</p>
            </div>
          </section>
        `;
        modal(title, detail, card.owned ? [
          `<button class="secondary-button" data-action="toast" data-message="已分享图鉴">分享</button>`
        ] : []);
      }
    });
  }

  function render() {
    const renderers = {
      index: renderIndex,
      "admin-workbench": renderAdminWorkbench,
      "admin-deploy-chest": renderAdminDeployChest,
      "admin-open-membership": renderAdminOpenMembership,
      "admin-sell-map": renderAdminSellMap,
      "admin-bundle": renderAdminBundle,
      "admin-grant-prop": renderAdminGrantProp,
      "admin-welcome-code": renderAdminWelcomeCode,
      welcome: renderWelcome,
      home: renderHome,
      explore: renderExplore,
      encyclopedia: renderEncyclopedia,
      scan: renderScan,
      "scan-result": renderScanResult,
      "box-open": renderBoxOpen,
      inventory: renderInventory,
      cards: renderCards,
      quest: renderQuest,
      profile: renderProfile
    };
    document.title = `${visiblePageLabel()} - 我的城市探秘`;
    (renderers[page] || renderIndex)();
    wireEvents();
  }

  render();
})();
