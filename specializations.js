const fs = require('fs');
const csv = require('csvtojson');

const { generateCombinations, cartesian } = require('./util');

const regulation = { ITSE: 24, VT1: 24, VT2: 15 };
const specializations = ['HCT', 'SAMT', 'BPET', 'OSIS', 'IST'];

const sumUpCoursCPs = (courses, spec) =>
  courses
    .filter(x => x.spec === spec)
    .map(x => x.cp)
    .reduce((x, y) => x + y, 0);

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
      });
    }

    if (course[VT1] === 1) {
      assignments.push({ name: course['Name'], spec: VT1, cp: course['CP'] });
    }

    if (course[VT2] === 1) {
      assignments.push({ name: course['Name'], spec: VT2, cp: course['CP'] });
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

      if (
        sums[0] <= regulation.ITSE &&
        sums[1] <= regulation.VT1 &&
        sums[2] <= regulation.VT2
      ) {
        return { bel: courseAssignment, sums };
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
            x.bel.forEach(x => console.log(x.name, x.spec));
          });
          if (c.length !== 0)
            summary += specCombination.join('\t') + '\t' + c.length + '\n';
        }
      }
      console.log(summary);
    });
};

module.exports = { getPossibleSpecializations };
