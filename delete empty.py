import sqlite3

def delete_empty_rows_all_columns(db_path, table_name):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all column names from the table
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns_info = cursor.fetchall()
    columns = [col[1] for col in columns_info]  # col[1] is the column name

    # Build condition for all columns being NULL or empty
    conditions = [f"({col} IS NULL OR {col} = '')" for col in columns]
    condition_str = " AND ".join(conditions)

    sql = f"DELETE FROM {table_name} WHERE {condition_str};"

    cursor.execute(sql)
    conn.commit()
    print(f"Deleted {cursor.rowcount} empty rows from {table_name}")

    cursor.close()
    conn.close()

# Usage
delete_empty_rows_all_columns('moviedata.db', 'moviesclub')
