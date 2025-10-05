import moment from "moment";

export const upperFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export const cutString = (string: string, length: number) => {
  if (string.length > length) {
    return string.slice(0, length) + "...";
  }

  return string;
};

export const formatMYSQLDate = (date: string) => {
  return moment(date).format("YYYY-MM-DD HH:mm:ss");
};