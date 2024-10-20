// Dummy getDefaultAuthSession function until we add
//  a true OAuth provider.

import {DiscordSession} from "@/app/reader/viewport";

export const getDefaultAuthSession = (): DiscordSession => {
    // Currently, the downstream code is expecting a Discord
    //  session object with these fields.
    return {
        "user": {
            "name": "discord_man",
            "email": "disman@gmail.com",
            "image": "https://cdn.discordapp.com/avatars/ava1.png",
            "id": "3838292938"
        }
    };
};
