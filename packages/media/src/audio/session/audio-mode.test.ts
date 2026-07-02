import { requestNotificationPermissions, setAudioMode, setIsAudioActive } from "./audio-mode";

describe("audio session (web)", () => {
  it("setAudioMode resolves as a no-op", async () => {
    await expect(
      setAudioMode({ playsInSilentMode: true, shouldPlayInBackground: true }),
    ).resolves.toBeUndefined();
  });

  it("setIsAudioActive resolves as a no-op", async () => {
    await expect(setIsAudioActive(false)).resolves.toBeUndefined();
  });

  it("requestNotificationPermissions grants when the Notification API is absent", async () => {
    const result = await requestNotificationPermissions();
    expect(result.granted).toBe(true);
    expect(result.status).toBe("granted");
  });
});
