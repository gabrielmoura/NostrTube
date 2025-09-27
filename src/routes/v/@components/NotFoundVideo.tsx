import {Card} from "@radix-ui/themes";
import {t} from "i18next"

export function NotFoundVideo({eventId}: { eventId?: string }) {
    return <div className="flex justify-center">
        <Card className="items-center">
            {t('video_not_found')} {eventId}
        </Card>
    </div>
}