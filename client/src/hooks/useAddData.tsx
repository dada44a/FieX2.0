import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAddData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ datas, link}: { datas: any; link: string; queryKey: string[] }) => {

      const response = await fetch(`${import.meta.env.VITE_API_LINK}${link}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datas),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;


    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: variables.queryKey });

    }
  });
};


export const useEditData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ datas, link}: { datas: any; link: string; queryKey: string[] }) => {

      const response = await fetch(`${import.meta.env.VITE_API_LINK}${link}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datas),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;


    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: variables.queryKey });

    }
  });
};

export const useDeleteData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ link}: {link: string; queryKey: string[] }) => {

      const response = await fetch(`${import.meta.env.VITE_API_LINK}${link}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: variables.queryKey });

    }
  });
};