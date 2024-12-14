export const searchFilter = (search: string | null) => {
  if (!search) {
    return undefined;
  }

  const searchConditions = [];
  if (search) {
    searchConditions.push(
      { username: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } }
    );
  }

  return {
    OR: searchConditions,
  };
};
