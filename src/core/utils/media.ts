import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

async function saveLocally(uri: string): Promise<string> {
  const dest = `${FileSystem.documentDirectory}journey-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export async function pickJourneyPhoto(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  if (res.canceled) return null;
  return saveLocally(res.assets[0].uri);
}

export async function takeJourneyPhoto(): Promise<string | null> {
  const res = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
  if (res.canceled) return null;
  return saveLocally(res.assets[0].uri);
}
