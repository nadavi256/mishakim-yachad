import { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toasts } from "./components/shell";
import { StoreProvider } from "./data/store";
import { ActivityScreen, ChatScreen } from "./screens/ActivityScreen";
import { DiscoveryScreen } from "./screens/DiscoveryScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MyActivitiesScreen } from "./screens/MyActivitiesScreen";
import {
  EditProfileScreen,
  NotificationsScreen,
  ProfileScreen,
  PublicProfileScreen,
  SavedActivitiesScreen,
  SavedPeopleScreen,
  SettingsScreen,
} from "./screens/ProfileScreen";
import { PublishScreen } from "./screens/PublishScreen";

function ScrollReset() {
  const location = useLocation();
  useEffect(() => {
    document.querySelector("[data-scroll]")?.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
}

function AppRoutes() {
  return (
    <>
      <ScrollReset />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/discover" element={<DiscoveryScreen />} />
        <Route path="/my" element={<MyActivitiesScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/profile/edit" element={<EditProfileScreen />} />
        <Route path="/profile/public" element={<PublicProfileScreen selfView />} />
        <Route path="/u/:id" element={<PublicProfileScreen />} />
        <Route path="/saved/people" element={<SavedPeopleScreen />} />
        <Route path="/saved/activities" element={<SavedActivitiesScreen />} />
        <Route path="/settings/:key" element={<SettingsScreen />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
        <Route path="/activity/:id" element={<ActivityScreen />} />
        <Route path="/activity/:id/chat" element={<ChatScreen />} />
        <Route path="/publish/:step" element={<PublishScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toasts />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </StoreProvider>
  );
}
