const { CodedApiError } = require('./CodedApiError.util');

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateOnly(value, endOfDay = false) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }

  const match = DATE_ONLY.exec(trimmed);
  if (!match) {
    throw new CodedApiError('INVALID_DATE', 'Date must be YYYY-MM-DD', 400);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    throw new CodedApiError('INVALID_DATE', 'Invalid calendar date', 400);
  }

  return date;
}

function resolveCreatedAtFilter(from, to) {
  const gte = parseDateOnly(from, false);
  const lte = parseDateOnly(to, true);

  if (gte && lte && gte > lte) {
    throw new CodedApiError(
      'INVALID_DATE_RANGE',
      'The start date must be before or equal to the end date',
      400,
    );
  }

  if (!gte && !lte) {
    return undefined;
  }

  return {
    ...(gte ? { gte } : {}),
    ...(lte ? { lte } : {}),
  };
}

module.exports = {
  parseDateOnly,
  resolveCreatedAtFilter,
};
