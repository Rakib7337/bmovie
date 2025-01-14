require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { searchMovies, getMovie } = require('./movies_scraper');
const axios = require('axios');

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Welcome Command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
        `Hello ${msg.from.first_name}, Welcome to SB Movies.\n` +
        `🔥 Download Your Favourite Movies For 💯 Free And 🍿 Enjoy it.`
    );
    bot.sendMessage(chatId, '👇 Enter Movie Name 👇');
});

// Find Movie Handler
bot.on('text', async (msg) => {
    if (msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const processingMessage = await bot.sendMessage(chatId, 'Processing...');

    try {
        const moviesList = await searchMovies(msg.text);

        if (moviesList.length > 0) {
            const keyboard = {
                inline_keyboard: moviesList.map(movie => [{
                    text: movie.title,
                    callback_data: movie.id
                }])
            };

            bot.editMessageText('Search Results...', {
                chat_id: chatId,
                message_id: processingMessage.message_id,
                reply_markup: keyboard
            });
        } else {
            bot.editMessageText(
                'Sorry 🙏, No Result Found!\nCheck If You Have Misspelled The Movie Name.', 
                {
                    chat_id: chatId,
                    message_id: processingMessage.message_id
                }
            );
        }
    } catch (error) {
        console.error('Error in movie search:', error);
    }
});

// Movie Result Callback
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    
    try {
        const movieDetails = await getMovie(callbackQuery.data);

        // Send Movie Poster
        const imageResponse = await axios.get(movieDetails.img, { responseType: 'arraybuffer' });
        await bot.sendPhoto(chatId, imageResponse.data, {
            caption: `🎥 ${movieDetails.title}`
        });

        // Send Download Links
        let linksMessage = '⚡ Fast Download Links :-\n\n';
        for (const [key, value] of Object.entries(movieDetails.links)) {
            linksMessage += `🎬 ${key}\n${value}\n\n`;
        }

        // Split message if too long
        const maxLength = 4095;
        for (let i = 0; i < linksMessage.length; i += maxLength) {
            await bot.sendMessage(chatId, linksMessage.slice(i, i + maxLength));
        }
    } catch (error) {
        console.error('Error in callback query:', error);
    }
});