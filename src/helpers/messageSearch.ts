export const messageSearch = (search: string | null) => {
  if (!search) {
    return undefined;
  }

  const searchConditions = [];
  if (search) {
    searchConditions.push({
      message: { contains: search, mode: "insensitive" },
    });
  }

  return {
    OR: searchConditions,
  };
};
