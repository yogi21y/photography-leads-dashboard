// Business logic for the leads dashboard. Loaded as a classic script so the
// site works when opened directly from disk, without a server.
var LeadsLogic = (function () {
  var STORAGE_KEY = "leads-dashboard";

  var SHOOT_TYPES = ["סטילס", "וידאו", "סטילס ווידאו"];

  var STAGE_NEW = "פנייה חדשה";
  var STAGE_CALL = "שיחה עם לקוח";
  var STAGE_QUOTE = "נשלחה הצעת מחיר";
  var STAGE_CLOSED = "נסגרה עסקה";
  var STAGE_LOST = "לא התקדמה";
  var STAGES = [STAGE_NEW, STAGE_CALL, STAGE_QUOTE, STAGE_CLOSED, STAGE_LOST];

  function isBlank(value) {
    return value === undefined || value === null || String(value).trim() === "";
  }

  function isValidAmount(value) {
    return isBlank(value) || (isFinite(Number(value)) && Number(value) >= 0);
  }

  // A blank or invalid amount counts as 0 in the closed deals value.
  function toAmount(value) {
    return !isBlank(value) && isValidAmount(value) ? Number(value) : 0;
  }

  // Returns the names of the invalid fields; an empty list means the lead is valid.
  function validateLead(data) {
    var errors = [];
    if (isBlank(data.name)) errors.push("name");
    if (isBlank(data.phone)) errors.push("phone");
    if (SHOOT_TYPES.indexOf(data.shootType) === -1) errors.push("shootType");
    if (STAGES.indexOf(data.stage) === -1) errors.push("stage");
    if (!isValidAmount(data.amount)) errors.push("amount");
    return errors;
  }

  function nextId(leads) {
    return leads.reduce(function (max, lead) {
      return Math.max(max, lead.id);
    }, 0) + 1;
  }

  function addLead(leads, data) {
    return leads.concat([Object.assign({}, data, { id: nextId(leads) })]);
  }

  function updateLead(leads, id, changes) {
    return leads.map(function (lead) {
      return lead.id === id ? Object.assign({}, lead, changes, { id: id }) : lead;
    });
  }

  function changeStage(leads, id, stage) {
    return updateLead(leads, id, { stage: stage });
  }

  // An empty criterion means "all". Affects the leads list only, never the summary.
  function filterLeads(leads, criteria) {
    return leads.filter(function (lead) {
      return (!criteria.stage || lead.stage === criteria.stage) &&
        (!criteria.shootType || lead.shootType === criteria.shootType);
    });
  }

  // Always pass all leads, not a filtered list.
  function computeSummary(leads) {
    var closed = filterLeads(leads, { stage: STAGE_CLOSED });
    return {
      totalLeads: leads.length,
      closedDeals: closed.length,
      closedValue: closed.reduce(function (sum, lead) {
        return sum + toAmount(lead.amount);
      }, 0)
    };
  }

  // Local date as YYYY-MM-DD, the format of the follow-up dates.
  function toDateString(date) {
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  // Open leads whose follow-up date is today or earlier, oldest first.
  function dueFollowUps(leads, today) {
    return leads.filter(function (lead) {
      return lead.stage !== STAGE_CLOSED && lead.stage !== STAGE_LOST &&
        !isBlank(lead.followUpDate) && lead.followUpDate <= today;
    }).sort(function (a, b) {
      return a.followUpDate < b.followUpDate ? -1 : a.followUpDate > b.followUpDate ? 1 : 0;
    });
  }

  function saveLeads(storage, key, leads) {
    storage.setItem(key, JSON.stringify(leads));
  }

  // Returns null when nothing usable is stored under the key.
  function loadLeads(storage, key) {
    try {
      var leads = JSON.parse(storage.getItem(key));
      return Array.isArray(leads) ? leads : null;
    } catch (error) {
      return null;
    }
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    SHOOT_TYPES: SHOOT_TYPES,
    STAGES: STAGES,
    STAGE_NEW: STAGE_NEW,
    STAGE_CALL: STAGE_CALL,
    STAGE_QUOTE: STAGE_QUOTE,
    STAGE_CLOSED: STAGE_CLOSED,
    STAGE_LOST: STAGE_LOST,
    validateLead: validateLead,
    addLead: addLead,
    updateLead: updateLead,
    changeStage: changeStage,
    filterLeads: filterLeads,
    computeSummary: computeSummary,
    toDateString: toDateString,
    dueFollowUps: dueFollowUps,
    saveLeads: saveLeads,
    loadLeads: loadLeads
  };
})();
