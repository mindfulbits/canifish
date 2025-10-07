const Utils = (() => {
    function celsiusToFahrenheit(celsius) {
        return (celsius * 9) / 5 + 32;
    }

    function formatDateTime(dateTimeString) {
        try {
            const date = new Date(dateTimeString);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const year = date.getFullYear().toString().slice(-2);
            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            return `${month}/${day}/${year}, ${hours}:${minutes} ${ampm}`;
        } catch (err) {
            console.warn('Unable to format date time', dateTimeString, err);
            return dateTimeString;
        }
    }

    function safeJSONParse(text) {
        try {
            return JSON.parse(text);
        } catch (error) {
            console.warn('Malformed JSON payload encountered', error);
            return null;
        }
    }

    return {
        celsiusToFahrenheit,
        formatDateTime,
        safeJSONParse
    };
})();
