import React, { createContext, useState, useContext, useEffect } from "react";
import { authAPI, userAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem("access_token");
      const userData = {
        id: localStorage.getItem("user_id"),
        username: localStorage.getItem("username"),
        firstName: localStorage.getItem("first_name"),
        lastName: localStorage.getItem("last_name"),
        role: localStorage.getItem("role"),
        email: localStorage.getItem("email"),
      };

      console.log("AuthContext init - token:", token);
      console.log("AuthContext init - userData:", userData);

      // Check if we have valid user data
      const hasValidUserData =
        token &&
        userData.username &&
        userData.username !== "null" &&
        userData.username !== "undefined";

      console.log("AuthContext init - hasValidUserData:", hasValidUserData);

      if (hasValidUserData) {
        // Ensure all values are valid strings
        const validUserData = {
          id:
            userData.id && userData.id !== "null" && userData.id !== "undefined"
              ? userData.id
              : null,
          username: userData.username,
          firstName:
            userData.firstName &&
            userData.firstName !== "null" &&
            userData.firstName !== "undefined"
              ? userData.firstName
              : "",
          lastName:
            userData.lastName &&
            userData.lastName !== "null" &&
            userData.lastName !== "undefined"
              ? userData.lastName
              : "",
          role:
            userData.role &&
            userData.role !== "null" &&
            userData.role !== "undefined"
              ? userData.role
              : "patient",
          email:
            userData.email &&
            userData.email !== "null" &&
            userData.email !== "undefined"
              ? userData.email
              : "",
        };

        console.log("AuthContext init - setting valid user:", validUserData);
        setUser(validUserData);
        setIsAuthenticated(true);
      } else {
        // Clear invalid data from localStorage
        console.log("AuthContext init - clearing invalid data");
        if (
          !token ||
          userData.username === "null" ||
          userData.username === "undefined"
        ) {
          localStorage.removeItem("access_token");
        }
        if (
          !userData.username ||
          userData.username === "null" ||
          userData.username === "undefined"
        ) {
          localStorage.removeItem("username");
          localStorage.removeItem("user_id");
          localStorage.removeItem("first_name");
          localStorage.removeItem("last_name");
          localStorage.removeItem("role");
          localStorage.removeItem("email");
        }
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (userData, tokens) => {
    // Store tokens
    localStorage.setItem("access_token", tokens.access);
    if (tokens.refresh) {
      localStorage.setItem("refresh_token", tokens.refresh);
    }

    // Store complete user data including ID
    localStorage.setItem("user_id", userData.id);
    localStorage.setItem("username", userData.username);
    localStorage.setItem("first_name", userData.first_name || "");
    localStorage.setItem("last_name", userData.last_name || "");
    localStorage.setItem("role", userData.role || "patient");
    localStorage.setItem("email", userData.email || "");

    setUser({
      id: userData.id,
      username: userData.username,
      firstName: userData.first_name,
      lastName: userData.last_name,
      role: userData.role,
      email: userData.email,
    });
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Clear all stored data
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("first_name");
    localStorage.removeItem("last_name");
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    setUser(null);
    setIsAuthenticated(false);
  };

  // Function to fetch complete user profile
  const fetchUserProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const fullUser = response.data;

      // Update localStorage with complete user data
      if (fullUser.id) {
        localStorage.setItem("user_id", fullUser.id);
      }

      if (fullUser.username) {
        localStorage.setItem("username", fullUser.username);
      }

      if (fullUser.first_name) {
        localStorage.setItem("first_name", fullUser.first_name);
      }

      if (fullUser.last_name) {
        localStorage.setItem("last_name", fullUser.last_name);
      }

      if (fullUser.role) {
        localStorage.setItem("role", fullUser.role);
      }

      if (fullUser.email) {
        localStorage.setItem("email", fullUser.email);
      }

      // Update state
      setUser({
        id: fullUser.id || user?.id,
        username: fullUser.username || user?.username,
        firstName: fullUser.first_name || user?.firstName,
        lastName: fullUser.last_name || user?.lastName,
        role: fullUser.role || user?.role,
        email: fullUser.email || user?.email,
      });

      return fullUser;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    fetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
