// EDIT THIS FILE: replace the sample timetables with the 10 real sections.
// Each day lists one entry PER CLASS PERIOD (a 2-hour lab = repeat the name twice).
window.ATTENDANCE_DATA = {
  start: "2026-08-29",
  end: "2026-11-29",
  holidays: ["2026-10-02", "2026-10-20", "2026-11-08"], // sample: add real holidays (YYYY-MM-DD)
  sections: {
    "Section 1": {
      Mon: ["Maths", "Physics", "DSA", "DSA Lab", "DSA Lab"],
      Tue: ["Physics", "English", "Maths", "Physics Lab", "Physics Lab"],
      Wed: ["DSA", "Maths", "English", "Physics"],
      Thu: ["English", "DSA", "Physics", "Maths"],
      Fri: ["Maths", "DSA", "Physics", "English"],
      Sat: ["DSA", "Maths"]
    },
    "Section 2": {
      Mon: ["DSA", "Maths", "English", "Physics"],
      Tue: ["DSA Lab", "DSA Lab", "Maths", "Physics"],
      Wed: ["Physics", "English", "DSA", "Maths"],
      Thu: ["Maths", "Physics Lab", "Physics Lab", "DSA"],
      Fri: ["English", "Physics", "Maths", "DSA"]
    }
    // "Section 3": { Mon: [...], ... }, ... up to Section 10
  }
};
