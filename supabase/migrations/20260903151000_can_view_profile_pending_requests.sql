-- listOutgoingRequests/listIncomingRequests join profiles for the other
-- side of a pending friend_request, but can_view_profile only allowed
-- public profiles or existing friends — so a pending request (by
-- definition, not yet friends) always came back with a null joined
-- profile and got filtered out. A pending request between two users is
-- itself a legitimate reason to see each other's basic profile.
create or replace function public.can_view_profile(target uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case
    when auth.uid() = target then true
    when public.is_blocked(auth.uid(), target) then false
    else exists (
      select 1 from public.profiles p
      where p.id = target
        and (
          p.profile_visibility = 'public'
          or (p.profile_visibility = 'friends' and public.are_friends(auth.uid(), target))
        )
    ) or exists (
      select 1 from public.friend_requests fr
      where fr.status = 'pending'
        and ((fr.sender_id = auth.uid() and fr.receiver_id = target)
          or (fr.receiver_id = auth.uid() and fr.sender_id = target))
    )
  end;
$$;
