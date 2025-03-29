import { useQueryClient } from "@tanstack/react-query";
import React, { use } from "react";

const useRefatch = () => {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.refetchQueries({
      type: "active",
    });
  };
};

export default useRefatch;
