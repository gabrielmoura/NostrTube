import {useEffect} from "react";

/**
 * Hook to set the title of the page
 * @param title
 */
export function useTitle(title:string) {
    useEffect(() => {
        document.title = title;
    }, [title])
}