const csv = require('csvtojson');

const { generateCombinations, cartesian } = require('./util');

const regulation = {
  ITSE: [[18, 3], [6, 1]],
  VT1: [[18, 3], [6, 1]],
  VT2: [[9, 3], [6, 1]],
};
const specializations = ['HCT', 'SAMT', 'BPET', 'OSIS', 'IST'];

const sumUpCoursCPs = (courses, spec) =>
  courses
    .filter(x => x.spec === spec)
    .map(x => x.cp)
    .reduce((x, y) => x + y, 0);

const getFinalGrade = (courses, spec) => {
  const grades = courses.filter(x => x.spec === spec).map(x => x.grade);
  const gradeCombinations = [];

  for (let x of generateCombinations(grades)) {
    gradeCombinations.push(x);
  }

  const finalGrades = gradeCombinations.map(x => {
    let sumpCp = 0;
    let sumGrad = 0;
    let sumFactor = 0;
    x.forEach(xx => {
      if (sumpCp < 6) {
        sumGrad += xx;
        sumFactor++;
      } else {
        sumGrad += 3 * xx;
        sumFactor += 3;
      }
    });
    return sumGrad / sumFactor;
  });
  return Math.min(...finalGrades);
};

const generateCourseAssignmentsForSpecCombo = (courses, spec) => {
  const [VT1, VT2] = spec;
  const allAssignments = [];

  courses.forEach(course => {
    const assignments = [];

    if (course['ITSE'] === 1) {
      assignments.push({
        name: course['Name'],
        spec: 'ITSE',
        cp: course['CP'],
        grade: course['Grade'],
      });
    }

    if (course[VT1] === 1) {
      assignments.push({
        name: course['Name'],
        spec: VT1,
        cp: course['CP'],
        grade: course['Grade'],
      });
    }

    if (course[VT2] === 1) {
      assignments.push({
        name: course['Name'],
        spec: VT2,
        cp: course['CP'],
        grade: course['Grade'],
      });
    }

    allAssignments.push(assignments);
  });

  // If there are courses that cannot be assigned to a spec,
  // we can't get the CPs. So ignore this spec combo.
  if (allAssignments.some(x => x.length === 0)) {
    return null;
  }

  const allPossibleCourseAssignments = cartesian(...allAssignments);

  // useful in the sense that we don't want to waste CPs
  const usefulCourseAssignments = allPossibleCourseAssignments
    .map(courseAssignment => {
      const sums = ['ITSE', VT1, VT2].map(x =>
        sumUpCoursCPs(courseAssignment, x)
      );

      const allGrades = ['ITSE', VT1, VT2].map(x =>
        getFinalGrade(courseAssignment, x)
      );

      // console.log(allGrades);

      const grade =
        (allGrades[0] * (18 * 3 + 6) +
          allGrades[1] * (18 * 3 + 6) +
          allGrades[2] * (9 * 3 + 6) +
          9 * 1.0 * 3 +
          30 * 3.0 * 3) /
        (2 * 18 * 3 + 9 + 3 * 6 + 39 * 3);

      if (
        sums[0] <= regulation.ITSE.map(x => x[0]).reduce((x, y) => x + y) &&
        sums[1] <= regulation.VT1.map(x => x[0]).reduce((x, y) => x + y) &&
        sums[2] <= regulation.VT2.map(x => x[0]).reduce((x, y) => x + y)
      ) {
        return { bel: courseAssignment, sums, grade };
      }
      return null;
    })
    .filter(x => x !== null);

  return usefulCourseAssignments;
};

const allSpecCombinations = generateCombinations(specializations);

const getPossibleSpecializations = path => {
  const allCourses = [];

  csv({
    colParser: {
      CP: 'number',
      Grade: 'number',
      HCT: 'number',
      SAMT: 'number',
      BPET: 'number',
      OSIS: 'number',
      IST: 'number',
    },
    checkType: true,
  })
    .fromFile(path)
    .on('json', data => allCourses.push(data))
    .on('done', () => {
      let summary =
        '\n# Summary (VT1, VT2, number of possible assignments)\n\n';
      for (const specCombination of allSpecCombinations) {
        const c = generateCourseAssignmentsForSpecCombo(
          allCourses,
          specCombination
        );
        if (c !== null) {
          c.forEach(x => {
            console.log(specCombination);
            console.log(x.sums);
            console.log(x.grade);
            x.bel.forEach(x => console.log(x.name, x.spec, x.grade));
          });
          if (c.length !== 0)
            summary += specCombination.join('\t') + '\t' + c.length + '\n';
        }
      }
      console.log(summary);
    });
};

module.exports = { getPossibleSpecializations };
