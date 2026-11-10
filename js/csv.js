(function () {
  "use strict";

  function parseCsv(text) {
    var records = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    var i = 0;
    var len = text.length;

    if (text.charCodeAt(0) === 0xfeff) i = 1;

    while (i < len) {
      var ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i++;
          continue;
        }
        field += ch;
        i++;
        continue;
      }

      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === ",") {
        row.push(field);
        field = "";
        i++;
        continue;
      }
      if (ch === "\r") {
        i++;
        continue;
      }
      if (ch === "\n") {
        row.push(field);
        records.push(row);
        row = [];
        field = "";
        i++;
        continue;
      }
      field += ch;
      i++;
    }

    if (field !== "" || row.length > 0) {
      row.push(field);
      records.push(row);
    }

    var nonEmpty = records.filter(function (r) {
      return r.some(function (c) { return c.trim() !== ""; });
    });
    if (nonEmpty.length === 0) return { headers: [], rows: [] };

    var headers = nonEmpty[0].map(function (h) { return h.trim().toLowerCase(); });
    var rows = nonEmpty.slice(1).map(function (r) {
      var obj = {};
      headers.forEach(function (h, idx) {
        if (h) obj[h] = (r[idx] || "").trim();
      });
      return obj;
    });

    return { headers: headers, rows: rows };
  }

  window.parseCsv = parseCsv;
})();
