// UI for the leads dashboard. All business rules live in logic.js.
(function () {
  var L = LeadsLogic;

  var FIELDS = ["name", "phone", "shootType", "description", "shootDate", "amount", "stage", "followUpDate", "notes"];

  var FIELD_ERRORS = {
    name: "יש להזין שם",
    phone: "יש להזין טלפון",
    shootType: "יש לבחור סוג צילום",
    stage: "יש לבחור שלב טיפול",
    amount: "הסכום חייב להיות מספר שאינו שלילי"
  };

  var leads = [];
  var editingId = null;
  var storage = getStorage();

  function $(id) {
    return document.getElementById(id);
  }

  function getStorage() {
    try {
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function addOptions(select, values, blankLabel) {
    if (blankLabel !== undefined) {
      var blank = el("option", "", blankLabel);
      blank.value = "";
      select.appendChild(blank);
    }
    values.forEach(function (value) {
      var option = el("option", "", value);
      option.value = value;
      select.appendChild(option);
    });
  }

  function formatMoney(amount) {
    return Number(amount).toLocaleString("he-IL") + " ₪";
  }

  function formatDate(value) {
    var parts = String(value).split("-");
    return parts.length === 3 ? parts[2] + "/" + parts[1] + "/" + parts[0] : value;
  }

  function isBlank(value) {
    return value === undefined || value === null || String(value).trim() === "";
  }

  function save() {
    if (!storage) return;
    try {
      L.saveLeads(storage, L.STORAGE_KEY, leads);
    } catch (error) {
      $("storage-warning").hidden = false;
    }
  }

  function load() {
    var stored = storage ? L.loadLeads(storage, L.STORAGE_KEY) : null;
    if (stored) return stored;
    var demo = DemoData.create(new Date());
    leads = demo;
    save();
    return demo;
  }

  function stageBadge(stage) {
    return el("span", "badge stage-" + L.STAGES.indexOf(stage), stage);
  }

  function telLink(phone) {
    var link = el("a", "lead-phone", phone);
    link.href = "tel:" + String(phone).replace(/[^\d+*#]/g, "");
    return link;
  }

  function fact(label, value) {
    var row = el("div", "fact");
    row.appendChild(el("dt", "", label + ":"));
    row.appendChild(el("dd", "", value));
    return row;
  }

  function stageSelect(lead) {
    var select = el("select");
    select.setAttribute("aria-label", "שלב טיפול עבור " + lead.name);
    addOptions(select, L.STAGES);
    select.value = lead.stage;
    select.addEventListener("change", function () {
      leads = L.changeStage(leads, lead.id, select.value);
      save();
      render();
    });
    return select;
  }

  function editButton(lead) {
    var button = el("button", "btn", "עריכה");
    button.type = "button";
    button.setAttribute("aria-label", "עריכת הפנייה של " + lead.name);
    button.addEventListener("click", function () {
      openForm(lead.id);
    });
    return button;
  }

  function renderSummary() {
    var summary = L.computeSummary(leads);
    $("sum-total").textContent = summary.totalLeads;
    $("sum-closed").textContent = summary.closedDeals;
    $("sum-value").textContent = formatMoney(summary.closedValue);
  }

  function renderDue() {
    var due = L.dueFollowUps(leads, L.toDateString(new Date()));
    var list = $("due-list");
    list.textContent = "";
    $("due-empty").hidden = due.length > 0;
    due.forEach(function (lead) {
      var item = el("li", "due-item");
      item.appendChild(el("span", "name", lead.name));
      item.appendChild(telLink(lead.phone));
      item.appendChild(el("span", "", "חזרה: " + formatDate(lead.followUpDate)));
      item.appendChild(stageBadge(lead.stage));
      item.appendChild(el("span", "spacer"));
      item.appendChild(editButton(lead));
      list.appendChild(item);
    });
  }

  function renderLeadCard(lead) {
    var card = el("article", "lead");

    var head = el("div", "lead-head");
    head.appendChild(el("h3", "lead-name", lead.name));
    head.appendChild(stageBadge(lead.stage));
    card.appendChild(head);
    card.appendChild(telLink(lead.phone));

    var facts = el("dl", "facts");
    facts.appendChild(fact("סוג צילום", lead.shootType));
    if (!isBlank(lead.description)) facts.appendChild(fact("עבודה", lead.description));
    if (!isBlank(lead.shootDate)) facts.appendChild(fact("תאריך צילום", formatDate(lead.shootDate)));
    if (!isBlank(lead.amount)) facts.appendChild(fact("סכום משוער", formatMoney(lead.amount)));
    if (!isBlank(lead.followUpDate)) facts.appendChild(fact("חזרה", formatDate(lead.followUpDate)));
    if (!isBlank(lead.notes)) facts.appendChild(fact("הערות", lead.notes));
    card.appendChild(facts);

    var actions = el("div", "lead-actions");
    actions.appendChild(stageSelect(lead));
    actions.appendChild(editButton(lead));
    card.appendChild(actions);
    return card;
  }

  function renderLeads() {
    var filtered = L.filterLeads(leads, { stage: $("filter-stage").value, shootType: $("filter-type").value });
    var container = $("leads");
    container.textContent = "";
    // Newest first.
    filtered.slice().reverse().forEach(function (lead) {
      container.appendChild(renderLeadCard(lead));
    });

    var empty = $("leads-empty");
    empty.hidden = filtered.length > 0;
    empty.textContent = leads.length === 0 ? "אין פניות עדיין. אפשר להוסיף פנייה חדשה." : "אין פניות התואמות לסינון.";
    $("list-count").textContent = "מוצגות " + filtered.length + " מתוך " + leads.length + " פניות";
  }

  function render() {
    renderSummary();
    renderDue();
    renderLeads();
  }

  function formControl(name) {
    return $("lead-form").elements[name];
  }

  function showErrors(errors) {
    var spans = $("lead-form").querySelectorAll(".error");
    Array.prototype.forEach.call(spans, function (span) {
      var field = span.getAttribute("data-for");
      var invalid = errors.indexOf(field) !== -1;
      span.hidden = !invalid;
      span.textContent = invalid ? FIELD_ERRORS[field] : "";
      formControl(field).setAttribute("aria-invalid", invalid ? "true" : "false");
    });
    if (errors.length) formControl(errors[0]).focus();
  }

  function openForm(id) {
    editingId = id === undefined ? null : id;
    var lead = leads.filter(function (item) { return item.id === editingId; })[0] || {};
    $("form-title").textContent = editingId === null ? "פנייה חדשה" : "עריכת פנייה";
    FIELDS.forEach(function (field) {
      var value = lead[field];
      formControl(field).value = isBlank(value) ? "" : value;
    });
    if (editingId === null) formControl("stage").value = L.STAGE_NEW;
    showErrors([]);
    $("lead-dialog").showModal();
  }

  function onSubmit(event) {
    event.preventDefault();
    var data = {};
    FIELDS.forEach(function (field) {
      data[field] = formControl(field).value.trim();
    });

    var errors = L.validateLead(data);
    showErrors(errors);
    if (errors.length) return;

    data.amount = data.amount === "" ? "" : Number(data.amount);
    leads = editingId === null ? L.addLead(leads, data) : L.updateLead(leads, editingId, data);
    save();
    render();
    $("lead-dialog").close();
  }

  function init() {
    addOptions($("filter-stage"), L.STAGES, "כל השלבים");
    addOptions($("filter-type"), L.SHOOT_TYPES, "כל הסוגים");
    addOptions(formControl("shootType"), L.SHOOT_TYPES, "בחירה...");
    addOptions(formControl("stage"), L.STAGES);

    if (!storage) $("storage-warning").hidden = false;
    leads = load();

    $("filter-stage").addEventListener("change", renderLeads);
    $("filter-type").addEventListener("change", renderLeads);
    $("add-btn").addEventListener("click", function () { openForm(); });
    $("cancel-btn").addEventListener("click", function () { $("lead-dialog").close(); });
    $("lead-form").addEventListener("submit", onSubmit);

    render();
  }

  init();
})();
