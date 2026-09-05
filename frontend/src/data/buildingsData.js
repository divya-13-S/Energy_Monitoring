/**
 * Official Institution Buildings Dataset
 * Defines the 8 campus buildings and their assigned departments/units.
 */

export const sampleBuildingsData = [
  {
    id: 'bldg_ib',
    name: 'IB Block',
    code: 'IB-BLOCK',
    units: ['EEE', 'EIE'],
    status: 'Connected',
  },
  {
    id: 'bldg_as',
    name: 'AS Block',
    code: 'AS-BLOCK',
    units: ['Textile', 'ECE', 'Civil'],
    status: 'Connected',
  },
  {
    id: 'bldg_mech',
    name: 'Mechanical Block',
    code: 'MECH-BLOCK',
    units: ['Mech', 'CT'],
    status: 'Connected',
  },
  {
    id: 'bldg_sunflower',
    name: 'Sunflower Block',
    code: 'SUNFLOWER-BLOCK',
    units: ['CSE', 'IT'],
    status: 'Attention Required',
  },
  {
    id: 'bldg_research',
    name: 'Research Park',
    code: 'RESEARCH-PARK',
    units: ['Aeronautical', 'Central Administration'],
    status: 'Connected',
  },
  {
    id: 'bldg_lib',
    name: 'Library',
    code: 'LIBRARY-BLOCK',
    units: ['Central Library'],
    status: 'Connected',
  },
  {
    id: 'bldg_gh',
    name: 'Girls Hostel',
    code: 'GH-BLOCK',
    units: ['Yamuna', 'Ganga', 'Narmadha', 'Cauvery'],
    status: 'Connected',
  },
  {
    id: 'bldg_bh',
    name: 'Boys Hostel',
    code: 'BH-BLOCK',
    units: ['Emerald', 'Sapphire', 'Pearl', 'Ruby'],
    status: 'Attention Required',
  },
];

export default sampleBuildingsData;
