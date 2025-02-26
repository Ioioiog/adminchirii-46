const { data: property, isLoading } = useQuery({
  queryKey: ["property", id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("properties")
      .select(`
        *,
        tenancies(
          id,
          status,
          tenant:profiles(
            id,
            first_name,
            last_name,
            email
          )
        ),
        landlord:profiles(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },
});
