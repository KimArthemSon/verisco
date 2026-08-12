import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";

export function usePullRefresh(refetch: () => Promise<unknown> | unknown) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.resolve(refetch());
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { refreshing, onRefresh };
}

export function useFocusRefresh(refetch: () => Promise<unknown> | unknown) {
  useFocusEffect(
    useCallback(() => {
      void Promise.resolve(refetch());
    }, [refetch]),
  );
}
