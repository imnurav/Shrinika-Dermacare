import { UserGender } from "../types";

export const DEFAULT_AVATAR_BY_GENDER: Record<UserGender, string> = {
  [UserGender.MALE]:
    "https://img.freepik.com/premium-vector/default-avatar-profile-icon-gray-placeholder-vector-illustration_514344-14757.jpg",
  [UserGender.FEMALE]:
    "https://img.freepik.com/premium-vector/avatar03_885953-438.jpg?semt=ais_rp_progressive",
  [UserGender.OTHER]:
    "https://img.freepik.com/premium-vector/default-avatar-profile-icon-gray-placeholder-vector-illustration_514344-14757.jpg",
};

export const getUserAvatar = (
  imageUrl?: string,
  gender: UserGender = UserGender.MALE,
): string =>
  imageUrl ||
  DEFAULT_AVATAR_BY_GENDER[gender] ||
  DEFAULT_AVATAR_BY_GENDER[UserGender.MALE];
