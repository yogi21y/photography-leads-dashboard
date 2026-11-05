// Demo leads only: fictional names and phone numbers. Follow-up dates are
// relative to the day the data is first loaded, so the due list is never empty.
var DemoData = (function () {
  function create(today) {
    var L = LeadsLogic;
    var STILLS = L.SHOOT_TYPES[0];
    var VIDEO = L.SHOOT_TYPES[1];
    var BOTH = L.SHOOT_TYPES[2];

    function offset(days) {
      return L.toDateString(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days));
    }

    function lead(id, name, shootType, description, shootDays, amount, stage, followDays, notes) {
      return {
        id: id,
        name: name + " (דמה)",
        phone: "050-000-00" + String(id).padStart(2, "0"),
        shootType: shootType,
        description: description,
        shootDate: shootDays === null ? "" : offset(shootDays),
        amount: amount,
        stage: stage,
        followUpDate: followDays === null ? "" : offset(followDays),
        notes: notes
      };
    }

    return [
      lead(1, "נועה לוי", STILLS, "צילומי משפחה בפארק", 21, 1200, L.STAGE_NEW, 0, "ביקשה לשמוע על חבילות"),
      lead(2, "אורי כץ", BOTH, "חתונה באולם, צילום ווידאו", 90, 14500, L.STAGE_QUOTE, -2, "לחזור עם הצעה מעודכנת"),
      lead(3, "מיכל ברק", VIDEO, "סרטון תדמית לעסק קטן", 35, 6000, L.STAGE_CALL, 1, ""),
      lead(4, "דניאל שפירא", STILLS, "צילומי מוצר לחנות אונליין", 14, 2800, L.STAGE_CLOSED, null, "שולם מקדמה בשיחה"),
      lead(5, "תמר אבני", BOTH, "בר מצווה: טקס ואירוע", 60, 9800, L.STAGE_CLOSED, null, ""),
      lead(6, "רונן גל", VIDEO, "קליפ קצר לאירוע חברה", 45, 4500, L.STAGE_LOST, -10, "בחר ספק אחר"),
      lead(7, "שירה מזרחי", STILLS, "צילומי הריון", 28, 1500, L.STAGE_QUOTE, 3, ""),
      lead(8, "איתי נחום", BOTH, "יום הולדת 40 עם סרטון תקציר", null, "", L.STAGE_NEW, -1, "לא צוין תקציב")
    ];
  }

  return { create: create };
})();
