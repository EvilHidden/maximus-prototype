import type { DbStaffMember } from "../schema";

export function createStaffMembers(): DbStaffMember[] {
  return [
    {
      id: "staff-tailor-luis",
      name: "Luis Rivera",
      role: "tailor",
      primaryLocationId: "loc_fifth_avenue",
    },
    {
      id: "staff-tailor-nina",
      name: "Nina Patel",
      role: "tailor",
      primaryLocationId: "loc_queens",
    },
  ];
}
