import { createFileRoute, Link, notFound, useLoaderData } from "@tanstack/react-router";
import { NDKKind } from "@nostr-dev-kit/ndk";
import { NDKEvent, type NDKUserProfile } from "@nostr-dev-kit/ndk-hooks";
import { getVideosFromUserData, type GetVideosFromUserDataParams } from "@/helper/nostr.ts";
import { PageSpinner } from "@/components/PageSpinner.tsx";
import { extractTag } from "@/helper/extractTag.ts";
import { useEffect } from "react";
import CreateProfile from "./@EditProfile.tsx";


export const Route = createFileRoute("/u/$userId")({
  component: ProfilePage,
  loader: ({ params: { userId }, context: { ndk } }) => getVideosFromUserData({
    userId,
    ndk
  } as GetVideosFromUserDataParams),
  pendingComponent: PageSpinner,
  notFoundComponent: CreateProfile
});



function ProfilePage() {
  const events = useLoaderData({ from: "/u/$userId" }) as Set<NDKEvent>;
  const user = JSON.parse([...events].filter(e => e.kind === NDKKind.Metadata)[0].content) as NDKUserProfile;
  const videos = [...events].filter(e => [NDKKind.Video, NDKKind.HorizontalVideo].includes(e.kind as number));
  useEffect(() => {
    //
    if (!user) {
      throw notFound();
    }
  }, [user]);


  return (
    <div className={"container mx-auto p-4"}>

      <img src={user?.banner || undefined} alt={user?.name || "Banner"}
           className={"w-full h-48 object-cover rounded-lg mb-4"} width={""} />
      <div className={"flex items-center mb-8"}>
        {user?.picture ?
          <img src={user.picture} alt={user.name || "User"} className={"w-16 h-16 rounded-full mr-4"} /> :
          <div className={"w-16 h-16 rounded-full bg-gray-300 mr-4"} />}
        <div>
          <h1 className={"text-2xl font-bold"}>{user?.name || "Unknown User"}</h1>
          <p className={"text-gray-600"}>{user?.nip05}</p>
        </div>
      </div>
      <div className={"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"}>
        {videos.map(video => {
          const t = extractTag(video.tags);
          return (
            <Link
              key={video.id}
              className={"bg-white rounded-lg shadow-md overflow-hidden"}
              to={"/v/$eventId"}
              params={{ eventId: video.id }}
            >
              {t.image ?
                <img src={t.image ?? t.thumb} alt={t.title || "Video"}
                     className={"w-full h-48 object-cover"} /> :
                <div className={"w-full h-48 bg-gray-300"} />}
              <div className={"p-4"}>
                <h2 className={"text-lg font-semibold mb-2"}>{t.title || "Untitled Video"}</h2>
                <p className={"text-gray-600 text-sm"}>{t.summary || "No description available."}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>);


}
