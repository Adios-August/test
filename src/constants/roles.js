// System roles constants
export const ROLES = {
  ADMIN: 'ADMIN',
  REVIEWER: 'REVIEWER', 
  BLOCKER: 'BLOCKED' // Note: using 'BLOCKED' to match the existing RoleManagement component
};

// Role permissions configuration
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    // Admin has full access to everything
    canAccessKnowledgeManagement: true,
    canManageRoles: true,
    canManageCategories: true,
    canViewQueries: true,
    canManageFeedback: true,
    canAddKnowledge: true,
    canEditKnowledge: true,
    canDeleteKnowledge: true,
    canViewKnowledge: true,
    canManageWorkspace: true // Only admin can change workspace
  },
  [ROLES.REVIEWER]: {
    // Reviewer has limited access to knowledge management
    canAccessKnowledgeManagement: true,
    canManageRoles: false,
    canManageCategories: true,
    canViewQueries: true,
    canManageFeedback: true,
    canAddKnowledge: true,
    canEditKnowledge: true,
    canDeleteKnowledge: false, // Reviewers can't delete
    canViewKnowledge: true,
    canManageWorkspace: false // Reviewers cannot change workspace
  },
  [ROLES.BLOCKER]: {
    // Blocker has very limited access - essentially read-only for knowledge
    canAccessKnowledgeManagement: false, // Key restriction: cannot access knowledge management
    canManageRoles: false,
    canManageCategories: false,
    canViewQueries: false,
    canManageFeedback: false,
    canAddKnowledge: false,
    canEditKnowledge: false,
    canDeleteKnowledge: false,
    canViewKnowledge: true, // Can still view knowledge content
    canManageWorkspace: false // Blockers cannot change workspace
  }
};

// Helper function to check if user has a specific permission
export const hasPermission = (userRole, permission) => {
  if (!userRole || !ROLE_PERMISSIONS[userRole]) {
    return false;
  }
  return ROLE_PERMISSIONS[userRole][permission] || false;
};

// Helper function to get user role from user object
export const getUserRole = (user) => {
  return user?.systemRole || null;
};

// Helper function to check if user can access knowledge management
export const canAccessKnowledgeManagement = (user) => {
  const role = getUserRole(user);
  return hasPermission(role, 'canAccessKnowledgeManagement');
};
