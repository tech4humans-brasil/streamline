export function convertFromCron(cron: string) {
  const [minute, hour, day, month, week] = cron.split(" ");

  const formatMinute = (min: string) => {
      const minuteNumber = Number(min)
    return minuteNumber === 0 ? "00" : min;
  };

  if (week !== "*" && week !== "?") {
    return {
      interval: Number(week),
      schedule: "week",
      time: `${hour}:${formatMinute(minute)}`,
       day: "*"
    };
  }

   if (month !== "*") {
    return {
      interval: Number(month.split("/")[1]),
      schedule: "month",
      time: `${hour}:${formatMinute(minute)}`,
       day: day === "*" ? "*" : String(day),
    };
  }
  if (day.includes("/")) {
    return {
      interval: Number(day.split("/")[1]),
      schedule: "day",
      time: `${hour}:${formatMinute(minute)}`,
       day: "*"
    };
  }
  if (day !== "*") {
    return {
      interval: Number(day),
      schedule: "day",
      time: `${hour}:${formatMinute(minute)}`,
        day: "*"
    };
  }

  if (hour !== "*") {
    return {
      interval: Number(hour),
      schedule: "hour",
      time: `${formatMinute(minute)}:00`,
      day: "*"
    };
  }

  if (minute.includes("/")) {
    return {
      interval: Number(minute.split("/")[1]),
      schedule: "minute",
        time: `${minute.split("/")[0]}:00`,
        day: "*"
    };
  }

  throw new Error(
    'Expressão inválida. Use "minute", "hour", "day", "week" ou "month".'
  );
}

export function convertToCron(
  value: number,
  schedule: string,
  time: string,
  day: number | null | string = "*"
) {
  const [hour, minute] = time.split(":").map(Number);
  let cronExpression = "";
  switch (schedule.toLowerCase()) {
    case "minute":
      cronExpression = `*/${value} * * * *`;
      break;
    case "hour":
      cronExpression = `${minute} */${value} * * *`;
      break;
    case "day":
      cronExpression = `${minute} ${hour} */${value} * *`;
      break;
    case "week":
      cronExpression = `${minute} ${hour} * * ${value % 7}`;
      break;
    case "month":
      if (day === "*" || day === null) {
        throw new Error(
          'Para "meses", o parâmetro "day" deve ser especificado (1-31).'
        );
      }
      cronExpression = `${minute} ${hour} ${day} */${value} *`;
      break;
    default:
      throw new Error(
        'Unidade de tempo inválida. Use "minute", "hour", "day", "week" ou "month".'
      );
  }
  return cronExpression;
}
