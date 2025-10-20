import styles from './components/Font.module.css';

export default function Home() {
  return (
    <>
    <section className=" flex flex-col items-center h-screen bg-orange-100 bg-no-repeat bg-cover">

    <div className=" w-full p-4   text-black flex">
   
    <nav className="space-x-8 w-full flex justify-end">
      <a href="">Home</a>
      <a href="">Books</a>
      <a href="">Movies</a>
      <a href="">TV-shows</a>
      <a href=""></a>
    </nav>
    </div>
    <div className="w-full ">
      <div className='flex flex-col items-center mt-28'> 
      <h1 className={`text-6xl ${styles.fontMelodrama} text-blue-900`}>Very cool movie<br></br> and books app</h1>
      
      </div>
      
    </div>
   
    </section>

    </>
  
    
  );
}
