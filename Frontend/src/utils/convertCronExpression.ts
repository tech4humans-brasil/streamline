export function convertToCron(value: number, schedule: string, time: string) {
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
      cronExpression = `${minute} ${hour} 1 */${value} *`;
      break;
    default:
      throw new Error(
        'Unidade de tempo inválida. Use "minutos", "horas", "dias", "semanas" ou "meses".'
      );
  }

  return cronExpression;
}

export function convertFromCron(cron: string) {
  const [minute, hour, day, month, week] = cron.split(" ");

  if (week !== "*" && day !== "*") {
    throw new Error(
      'Expressão inválida. Use "minutos", "horas", "dias", "semanas" ou "meses".'
    );
  }

  if (week !== "*") {
    return {
      value: Number(week),
      schedule: "week",
      time: `${hour}:${minute}`,
    };
  }

  if (day !== "*") {
    return {
      value: Number(day),
      schedule: "day",
      time: `${hour}:${minute}`,
    };
  }

  if (hour !== "*") {
    return {
      value: Number(hour),
      schedule: "hour",
      time: `${minute}:00`,
    };
  }

  return {
    interval: Number(minute.split("/")[1]),
    schedule: "minute",
    time: `${minute.split("/")[0]}:00`,
  };
}
