--pg_cron in subabase has been activated for data simulation.
CREATE extension if not exists pg_cron;

"""Simulation Function

    NOTE: The mathematical models, logic, and deviations used here are based on the AI's explanations of 
    how it processes data in the real energy market.

"""
CREATE OR REPLACE FUNCTION simulate_hourly_energy_data()
RETURNS void AS $$
DECLARE
  h integer;
  curr_time timestamp;

  -- variables
  --(consumption and price )
  cons_base float;
  cons_forecast float;
  cons_actual float;
  price_base float;
  price_ptf float;
  price_smf float;

  --(generation)
  plant RECORD;
  plant_capacity float;
  available_capacity float;
  total_affected_mw float;
  gen_planned float;
  gen_actual float;
  gen_settlement float;

BEGIN
  
  -- 1.time settings (UTC + 3)
  curr_time := date_trunc('hour', (now() AT TIME ZONE 'UTC' + interval '3 hours'));
  h := extract(hour from curr_time)::int;



  -------------------------------------------------------
  -- 1. CONSUMPTION 
  -------------------------------------------------------
  if h>=0 and h<6 then cons_base:=32000;--night(low)
  elsif h>=6 and h<9 then cons_base:=38000; --morning(high more than night)
  elsif h>=9 and h<17 then cons_base:=44000;--noon (working hours)
  elsif h>=17 and h<22 then cons_base:=49000; --evening (pick consumption)
  else cons_base:= 40000;
  end if;

  --demand_forecast
  cons_forecast:= cons_base + (random()* 4000-2000);
  --actual_consumption(May deviate by 5% from the estimate)
  cons_actual:=cons_forecast*(0.95 + random ()*0.10);

  --insert operation
  insert into national_consumption (timestamp, actual_consumption, demand_forecast)
  values (curr_time, cons_actual, cons_forecast)
  ON CONFLICT(timestamp) 
  DO UPDATE SET 
    actual_consumption = EXCLUDED.actual_consumption,
    demand_forecast = EXCLUDED.demand_forecast;





  -------------------------------------------------------
  -- 2. MARKET PRICE 
  -------------------------------------------------------
  if h>=8 and h <22 then price_base:=2500 + (random ()*1500); --morning expensive
  else price_base:=1500 + (random()*700); end if;
  
  price_ptf:=price_base;
  ---- SMP may deviate 15% up/down from PTF (Disequilibrium Price)
  price_smf:=price_ptf* (0.85 + random()*0.30);
  
  --insert operations
  insert into market_prices(timestamp, price_ptf, price_smf)
  values (curr_time, price_ptf, price_smf)
  ON CONFLICT(timestamp) 
  DO UPDATE SET 
    price_ptf = EXCLUDED.price_ptf,
    price_smf = EXCLUDED.price_smf;




    
  -------------------------------------------------------
  -- 3. GENERATION 
  -------------------------------------------------------
  for plant in select id, "installed_capacity" from power_plants loop

    if plant."installed_capacity" is null then plant_capacity:=100;
    else plant_capacity:=plant."installed_capacity"; end if;

    gen_planned:=plant_capacity*(0.60 + random()*0.40);

    -- plant_events control 
    select coalesce (sum(affected_capacity),0) into total_affected_mw
    from plant_events
    where power_plant_id=plant.id
      and start_time < (curr_time + interval '1 hour') 
      and (end_time >= curr_time or end_time is null);

  
    available_capacity:=plant_capacity - total_affected_mw;
    if available_capacity<0 then available_capacity:=0; end if;

    if available_capacity=0 then 
      gen_actual:=0;
    else 
      gen_actual:=available_capacity*(0.85 + random()*0.15);
      if gen_actual>available_capacity then gen_actual:=available_capacity; end if;
    end if;

    gen_settlement:=gen_actual*(0.99+random()*0.02);

    -- update operations
    insert into generation_data(timestamp, power_plant_id, planned_generation, actual_generation, settlement_generation)
    values(curr_time, plant.id, gen_planned, gen_actual, gen_settlement)
    ON CONFLICT (timestamp, power_plant_id) 
    DO UPDATE SET 
      actual_generation = EXCLUDED.actual_generation,
      settlement_generation = EXCLUDED.settlement_generation,
      planned_generation = EXCLUDED.planned_generation;
  
  end loop;

END;
$$ language plpgsql;



-- ***********************
-- TIMER
-- ***********************

-- job works each hour 
SELECT cron.schedule(
    'energy-simulation-hourly', -- job name
    '0 * * * *',                -- each hour
    'SELECT simulate_hourly_energy_data()'
);



CREATE OR REPLACE FUNCTION delete_old_data()
RETURNS void AS $$
BEGIN
  
  DELETE FROM generation_data 
  WHERE timestamp < now() - interval '7 days';

  
  DELETE FROM market_prices 
  WHERE timestamp < now() - interval '7 days';

  
  DELETE FROM national_consumption 
  WHERE timestamp < now() - interval '7 days';
  


END;
$$ LANGUAGE plpgsql;


SELECT cron.schedule(
    'daily-data-cleanup', 
    '30 3 * * *',         
    $$SELECT delete_old_data()$$
);


SELECT * FROM cron.job;