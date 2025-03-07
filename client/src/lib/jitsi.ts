import { type JitsiMeetExternalAPI } from "./types";

declare global {
  interface Window {
    JitsiMeetExternalAPI: typeof JitsiMeetExternalAPI;
  }
}

interface JitsiConfig {
  container: HTMLElement;
  domain: string;
  roomName: string;
  jwt: string;
  displayName?: string;
}

export function initJitsiMeet({ container, domain, roomName, jwt, displayName = "User" }: JitsiConfig) {
  // Ensure the room name only contains allowed characters
  const sanitizedRoomName = roomName.replace(/[^a-zA-Z0-9]/g, "_");

  const options = {
    roomName: sanitizedRoomName,
    jwt,
    width: "100%",
    height: "100%",
    parentNode: container,
    configOverwrite: {
      startWithAudioMuted: true,
      startWithVideoMuted: true,
      prejoinPageEnabled: false,
      disableDeepLinking: true
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      MOBILE_APP_PROMO: false,
      APP_NAME: 'Video Meeting',
      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
        'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
        'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
        'security'
      ],
    },
    userInfo: {
      displayName: displayName
    }
  };

  console.log(`Initializing Jitsi with domain: ${domain}, room: ${sanitizedRoomName}`);
  const api = new window.JitsiMeetExternalAPI(domain, options);

  // Handle events
  api.addEventListeners({
    readyToClose: () => {
      console.log('Jitsi meeting closed');
    },
    videoConferenceJoined: () => {
      console.log('Joined video conference');
    },
    participantJoined: (participant: any) => {
      console.log('Participant joined:', participant);
    },
    error: (error: any) => {
      console.error('Jitsi error:', error);
    }
  });

  return () => {
    api.dispose();
  };
}