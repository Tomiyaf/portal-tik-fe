export function getUserRole(user) {
  return user?.role || '';
}

export function isAdmin(user) {
  return getUserRole(user) === 'admin';
}

export function isStaff(user) {
  return getUserRole(user) === 'staff';
}

export function canAccessDashboard(user) {
  return isAdmin(user) || isStaff(user);
}

export function canAccessUsers(user) {
  return isAdmin(user);
}

export function canAccessParking(user) {
  return isAdmin(user);
}

export function canManageCctv(user) {
  return isAdmin(user);
}

export function canAccessLogs(user) {
  return isAdmin(user) || isStaff(user);
}

export function canAccessIntercom(user) {
  return isAdmin(user) || isStaff(user);
}

export function canAccessProfile(user) {
  return isAdmin(user) || isStaff(user);
}
